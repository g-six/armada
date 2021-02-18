import { APIGatewayProxyResult } from 'aws-lambda'
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

function transformItems(items: DynamoDB.DocumentClient.ItemList = []) {
    const docs: string[] = []

    items.forEach((doc) => {
        docs.push(transformDoc(doc))
    })

    return JSON.stringify({ docs }, null, 3)
}

function transformError(error: Record<string, unknown>) {
    return JSON.stringify(error, null, 3)
}

export const handler = async (): Promise<APIGatewayProxyResult> => {
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
