import { generate } from 'shortid'
import * as jwt from 'jsonwebtoken'
import { DynamoDB } from 'aws-sdk'
import { comparePassword, hashPassword } from '../utils/crypto'
import { create, update, retrieve, Record } from '../utils/dynamodb'
import { validateEmailAddress } from '../utils/email-helper'
import { Request } from 'express'
import { validatePassword } from '../utils/password-helper'

type User = {
    id: string
    email: string
    created_at: number
    updated_at: number
    role: string
    activation_key?: string
    expires_at?: number
    hashed_password?: string
    refresh_token?: string
    hashed_refresh_token?: string
    logged_in_at?: number
    name?: string
    token?: string
}

type ErrorMap = {
    [key: string]: string
}
type ModelErrorResponse = {
    error?: string
    errors?: ErrorMap
}

interface UserRequest extends Request {
    user: User
}

const activateUser = async (key: string, id: string) => {
    // Validate
    if (!key) {
        throw new Error('"Activation key" is required')
    }

    const user = await getById(id)

    if (!user || user.activation_key != key) {
        return {
            error: 'activation_params_invalid',
        }
    }
    const token = jwt.sign({ id }, process.env.token, {
        expiresIn: 604800, // 1 week
    })
    const { email, hashed_password } = user

    const info = {
        hashed_password,
        token,
    }

    await update(
        {
            hk: 'user',
            sk: `u#${id}`,
        },
        {
            ':i': info,
        },
        ['info = :i']
    )

    return { id, token, email }
}

const createUser = async (
    email: string,
    password: string,
    role = 'admin'
) => {
    const existing = await getByEmail(email)
    let errors: { [key: string]: string }
    if (existing) {
        errors = {
            ...errors,
            email: 'already_registered',
            ...existing.errors,
        }
    }
    if (!password) {
        errors = {
            ...errors,
            password: 'password_required',
        }
    } else if (password.length > 20 || password.length < 8) {
        errors = {
            ...errors,
            password: 'password_length_error',
        }
    } else if (!validatePassword(password)) {
        errors = {
            ...errors,
            password: 'password_invalid',
        }
    }

    if (errors) return { errors }

    const user_sort_key: string = generate()
    const activation_key = `ak.${generate()}`
    const hashed_password = hashPassword(password)
    const now = Math.round(Date.now() / 1000)
    const info = {
        activation_key,
        hashed_password,
    }
    const record: Record = {
        hk: 'user',
        sk: `u#${user_sort_key}`,
        hk2: `${role}#${user_sort_key}`,
        sk2: email,
        info,
        created_at: now,
        updated_at: now,
    }
    const doc = await create(record)
    const user: User = {
        id: user_sort_key,
        email: doc.sk2,
        created_at: now,
        updated_at: now,
        role,
        activation_key: doc.info.activation_key as string,
    }
    return user
}

/**
 *
 * @param email
 * @returns User document
 */
const getByEmail = async (email: string) => {
    // Validate
    if (!email) {
        return { errors: { email: 'email_required' } }
    }

    if (!validateEmailAddress(email)) {
        return { errors: { email: 'email_invalid' } }
    }

    const { Items } = await retrieve(
        'hk = :hk and sk2 = :sk2',
        { ':hk': 'user', ':sk2': email },
        process.env.dbIndex2
    )

    const doc = Items && Items[0] ? Items[0] : null

    if (doc) {
        const [hk2_role, hk2_id] = doc.hk2.split('#')
        const { activation_key, hashed_password } = doc.info
        return {
            id: hk2_id,
            role: hk2_role,
            email,
            activation_key,
            hashed_password,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
        }
    }
    return
}

/**
 *
 * @param id DynamoDB hash key (primary key)
 * @returns User document
 */
const getById = async (id: string) => {
    // Validate
    if (id === undefined || !id) {
        throw new Error('"id" is required')
    }

    const { Items } = await retrieve('hk = :hk and sk = :sk', {
        ':hk': 'user',
        ':sk': `u#${id}`,
    })

    return normalizeDoc(Items)
}

const normalizeDoc = (
    docs: DynamoDB.DocumentClient.ItemList
): User => {
    if (!docs || docs.length <= 0) return

    const {
        created_at,
        sk2: email,
        updated_at,
        hk2,
        info,
    } = docs[0]
    const [role, id] = hk2.split('#')
    const {
        hashed_password,
        hashed_refresh_token,
        activation_key,
        token,
    } = info

    return {
        id,
        email,
        role,
        hashed_password,
        hashed_refresh_token,
        activation_key,
        created_at,
        updated_at,
        token,
    } as User
}

/**
 *
 * @param id DynamoDB hash key (primary key)
 * @param token
 * @returns User document
 */
const getByIdAndToken = async (id: string, token: string) => {
    // Validate
    if (id === undefined || !id) {
        throw new Error('"id" is required')
    }
    if (token === undefined || !token) {
        throw new Error('"token" is required')
    }

    const { Items } = await retrieve('hk = :hk and sk = :sk', {
        ':hk': 'user',
        ':sk': `u#${id}`,
    })

    const doc = Items && Items[0] ? Items[0] : null
    if (doc && doc.info.token === token) {
        return {
            id,
            email: doc.sk2,
            token,
        }
    }

    return false
}

const loginUser = async (
    email: string,
    password: string
): Promise<User | ModelErrorResponse> => {
    let errors: ErrorMap

    if (!email) {
        errors = { email: 'email_required' }
    }

    if (!password) {
        errors = {
            ...errors,
            password: 'password_required',
        }
    }

    if (errors) {
        return { errors, error: 'login_failed' }
    }

    const user = await getByEmail(email)
    if (!user) {
        return { error: 'login_failed' }
    }

    const {
        activation_key,
        hashed_password,
        id,
        role,
        updated_at,
        created_at,
    } = user

    if (
        !id ||
        !hashed_password ||
        !comparePassword(password, hashed_password)
    ) {
        return { error: 'login_failed' }
    }

    const token = jwt.sign(
        { id, session_created_at: new Date().getTime() },
        process.env.token,
        {
            expiresIn: 604800, // 1 week
        }
    )

    const refresh_token = `${hashPassword(email)}.${generate()}`

    if (activation_key) {
        return {
            id,
            email,
            token,
            activation_key,
            refresh_token,
            role,
            created_at,
            updated_at,
        }
    }

    const info = {
        hashed_password,
        hashed_refresh_token: hashPassword(refresh_token),
        token,
    }

    await update(
        {
            hk: 'user',
            sk: `u#${id}`,
        },
        {
            ':i': info,
        },
        ['info = :i']
    )

    return {
        id,
        email,
        token,
        refresh_token,
        role,
        created_at,
        updated_at,
    }
}

const refreshToken = async (
    id: string,
    req_refresh_token: string
): Promise<User | ModelErrorResponse> => {
    let errors: ErrorMap

    if (!req_refresh_token) {
        errors = errors || {}
        errors = {
            refresh_token: 'refresh_token_required',
        }
    }

    if (!id) {
        errors = errors || {}
        errors = {
            ...errors,
            id: 'user_id_required',
        }
    }

    if (errors) {
        return { errors, error: 'refresh_token_failed' }
    }

    const user = await getById(id)
    if (!user) {
        return { error: 'refresh_token_failed no user' }
    }

    const {
        email,
        hashed_password,
        hashed_refresh_token,
        role,
        updated_at,
        created_at,
    } = user

    if (
        !user.id ||
        !hashed_refresh_token ||
        !comparePassword(req_refresh_token, hashed_refresh_token)
    ) {
        return {
            error: 'refresh_token_failed' + ' ' + req_refresh_token,
        }
    }

    const token = jwt.sign(
        { id, session_created_at: new Date().getTime() },
        process.env.token,
        {
            expiresIn: 604800, // 1 week
        }
    )

    const refresh_token = `${hashPassword(email)}.${generate()}`
    const info = {
        hashed_password,
        hashed_refresh_token: hashPassword(refresh_token),
        token,
    }

    await update(
        {
            hk: 'user',
            sk: `u#${id}`,
        },
        {
            ':i': info,
        },
        ['info = :i']
    )

    return {
        id,
        email,
        token,
        refresh_token,
        role,
        created_at,
        updated_at,
    }
}

const logoutUser = async (id: string) => {
    const { hashed_password } = await getById(id)
    const errors: string[] = []

    if (!id) {
        throw new Error('Unable to log user out')
    }

    if (errors.length > 0) {
        throw new Error('  ' + errors.join('\n  '))
    }

    const info = {
        hashed_password,
        logged_out_at: new Date().getTime(),
    }

    await update(
        {
            hk: 'user',
            sk: `u#${id}`,
        },
        {
            ':i': info,
        },
        ['info = :i']
    )

    return {
        id,
    }
}

export {
    activateUser,
    createUser,
    getByEmail,
    getById,
    getByIdAndToken,
    loginUser,
    logoutUser,
    refreshToken,
    User,
    UserRequest,
    ErrorMap,
    ModelErrorResponse,
}
