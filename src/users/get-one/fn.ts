import { DynamoDB } from 'aws-sdk'
import authorize from './auth'
import { transformDoc, transformError } from './transformers'

const db = new DynamoDB.DocumentClient()
const TABLE_NAME = process.env.TABLE_NAME || ''

export const handler = async (event: any = {}): Promise<any> => {
    const auth = authorize(event)
    if (auth.error) {
        return {
            statusCode: 403,
            body: transformError(auth),
        }
    }

    const doc_id = event.pathParameters.id
    if (!doc_id) {
        return {
            statusCode: 400,
            body: 'Error: You are missing the path parameter id',
        }
    }

    const params = {
        TableName: TABLE_NAME,
        Key: {
            doc_type: 'USER',
            doc_key: `u#${doc_id}`,
        },
    }

    try {
        const response = await db.get(params).promise()
        if (!response.Item) return { statusCode: 200 }
        return { statusCode: 200, body: transformDoc(response.Item) }
    } catch (dbError) {
        return { statusCode: 500, body: transformError(dbError) }
    }
}
