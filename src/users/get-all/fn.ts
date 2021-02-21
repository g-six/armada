import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import authorize from './auth'
import { transformError, transformItems } from './transformers'

const db = new DynamoDB.DocumentClient()
const TABLE_NAME = process.env.TABLE_NAME || ''

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const auth = authorize(event)
    if (auth.error) {
        return {
            statusCode: 403,
            body: transformError(auth),
        }
    }

    const params: DynamoDB.DocumentClient.QueryInput = {
        TableName: TABLE_NAME,
        KeyConditionExpression:
            'doc_type = :doc_type and begins_with(doc_key, :doc_key)',
        ExpressionAttributeValues: {
            ':doc_key': 'u#',
            ':doc_type': 'USER',
        },
    }

    try {
        const response = await db.query(params).promise()
        if (!response.Items) return { statusCode: 200, body: '{"docs": []}' }
        return { statusCode: 200, body: transformItems(response.Items) }
    } catch (dbError) {
        return { statusCode: 500, body: transformError(dbError) }
    }
}
