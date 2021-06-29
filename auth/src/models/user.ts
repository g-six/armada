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
    logged_in_at?: number
    name?: string
    token?: string
}

type FieldError = {
    [key: string]: string
}

type ErrorMap = {
    error?: string
    errors?: FieldError
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
        throw new Error(
            `Activation parameters invalid ${key} ${id}`
        )
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
): Promise<User | ErrorMap> => {
    const existing = await getByEmail(email)
    if (existing.id) {
        throw new Error(
            `"${email}" already registered.  Please select a different email or reset your password`
        )
    }
    if (!password) {
        throw new Error('PASSWORD_REQUIRED')
    } else if (!validatePassword(password)) {
        return { errors: { password: 'password_invalid' } }
    }

    const user_sort_key: string = generate()
    const activation_key = `ak.${generate()}`
    const hashed_password = hashPassword(password)
    const now = new Date().getTime()
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
        throw new Error('EMAIL_REQUIRED')
    }

    if (!validateEmailAddress(email)) {
        throw new Error('EMAIL_INVALID')
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
        }
    }
    return {}
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

    // Query
    const params = {
        TableName: process.env.db,
        KeyConditionExpression: 'hk = :hk and sk = :sk',
        ExpressionAttributeValues: {
            ':hk': 'user',
            ':sk': `u#${id}`,
        },
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
    const { hashed_password, activation_key, token } = info

    return {
        id,
        email,
        role,
        hashed_password,
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

    // Query
    const params = {
        TableName: process.env.db,
        KeyConditionExpression: 'hk = :hk and sk = :sk',
        ExpressionAttributeValues: {
            ':hk': 'user',
            ':sk': `u#${id}`,
        },
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

const loginUser = async (email: string, password: string) => {
    const { activation_key, hashed_password, id, role } =
        await getByEmail(email)
    const errors: string[] = []

    if (!id || !hashed_password || activation_key) {
        return { errors: ['login_failed'] }
    }

    if (!comparePassword(password, hashed_password)) {
        errors.push('login_failed')
    }

    if (errors.length > 0) {
        return { errors }
    }

    const token = jwt.sign(
        { id, session_created_at: new Date().getTime() },
        process.env.token,
        {
            expiresIn: 604800, // 1 week
        }
    )
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

    return {
        id,
        email,
        token,
        role,
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
    User,
    UserRequest,
    ErrorMap,
}
