import { retrieve } from '../utils/dynamodb'

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
interface UserRequest extends Request {
    user: User
}
/**
 *
 * @param id DynamoDB hash key (primary key)
 * @returns User document
 */
const getById = async (id: string): Promise<Record<string, string | number>> => {
    // Validate
    if (id === undefined || !id) {
        return { error: 'user_not_found' }
    }

    const [doc] = await retrieve('hk = :hk and sk = :sk', {
        ':hk': 'user',
        ':sk': `u#${id}`,
    })

    const [role, user_id] = doc.sk.split('#')
    const user = {
        id: user_id,
        email: doc.sk2,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        token: doc.info.token,
        role,
    }

    return user
}

const getByIdAndToken = async (id: string, token: string): Promise<Record<string, string>> => {
    // Validate
    if (id === undefined || !id) {
        return { error: 'id_required' }
    }
    if (token === undefined || !token) {
        return { error: 'token_required' }
    }

    // Query
    const [doc] = await retrieve('hk = :hk and sk = :sk', {
        ':hk': 'user',
        ':sk': `u#${id}`,
    })

    if (doc && doc.info.token === token) {
        return {
            id,
            email: doc.sk2,
            token,
        }
    }

    return { error: 'user_not_found' }
}

export { getById, getByIdAndToken, User, UserRequest }
