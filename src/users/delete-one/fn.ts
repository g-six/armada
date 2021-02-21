import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import authorize from './auth'
import { transformError, transformMessage } from './transformers'
const db = new DynamoDB.DocumentClient()
const TABLE_NAME = process.env.TABLE_NAME || ''

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
    if (!event || !event.pathParameters) {
        return {
            statusCode: 400,
            body: transformMessage(
                `Error: You are missing the path parameter id`
            ),
        }
    }

    const auth = authorize(event)
    if (auth.error) {
        return {
            statusCode: 403,
            body: transformError(auth),
        }
    }

    const doc_id: string = event.pathParameters.id || ''
    if (!doc_id) {
        return {
            statusCode: 400,
            body: transformMessage(
                `Error: You are missing the path parameter id`
            ),
        }
    }

    const Key = {
        doc_type: 'USER',
        doc_key: `u#${doc_id}`,
    }

    try {
        await db
            .delete({
                TableName: TABLE_NAME,
                Key,
            })
            .promise()
        return { statusCode: 200, body: transformMessage(`Deleted ${doc_id}`) }
    } catch (dbError) {
        const error = {
            ...dbError,
            Key,
        }
        return { statusCode: 500, body: transformError(error) }
    }
}
