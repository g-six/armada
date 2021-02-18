import { DynamoDB } from 'aws-sdk'
const db = new DynamoDB.DocumentClient()
const TABLE_NAME = process.env.TABLE_NAME || ''

function transformDoc(row: DynamoDB.DocumentClient.AttributeMap) {
    const { title, doc_key, uniq_attr, uniq_id } = row
    const [last_name, first_name] = (title as string).split(', ')
    return JSON.stringify(
        {
            doc: {
                first_name,
                last_name,
                id: (doc_key as string).split('#')[1],
                [(uniq_attr as string).toLowerCase()]: uniq_id,
            },
        },
        null,
        3
    )
}

function transformError(error: Error) {
    return JSON.stringify(error, null, 3)
}

export const handler = async (event: any = {}): Promise<any> => {
    const doc_id = event.pathParameters.id
    if (!doc_id) {
        return {
            statusCode: 400,
            body: `Error: You are missing the path parameter id`,
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
