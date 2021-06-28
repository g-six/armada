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

const getByIdAndToken = async (id: string, token: string) => {
    // Validate
    if (id === undefined || !id) {
        throw new Error('"id" is required')
    }
    if (token === undefined || !token) {
        throw new Error('"token" is required')
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

    return false
}

export { getById, getByIdAndToken, User }
