import { DynamoDB } from 'aws-sdk'
const db = new DynamoDB.DocumentClient()
const TABLE_NAME = process.env.TABLE_NAME || ''

function transformMessage(message: string) {
    return JSON.stringify({ message }, null, 3)
}
function transformError(error: Error) {
    return JSON.stringify(error, null, 3)
}

export const handler = async (event: any = {}): Promise<any> => {
    const doc_id: string = event.pathParameters.id
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
