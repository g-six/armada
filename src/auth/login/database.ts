import { DynamoDB } from 'aws-sdk'
import { QueryOutput, UpdateItemOutput } from 'aws-sdk/clients/dynamodb'
import { PromiseResult } from 'aws-sdk/lib/request'
const db = new DynamoDB.DocumentClient()
const TABLE_NAME = process.env.TABLE_NAME || ''

export const query = async (email: DynamoDB.AttributeValue) => {
    const query_params: DynamoDB.QueryInput = {
        TableName: TABLE_NAME,
        IndexName: 'gsi3',
        KeyConditionExpression: 'doc_type = :doc_type and uniq_id = :uniq_id',
        ExpressionAttributeValues: {
            ':uniq_id': email,
            ':doc_type': 'USER' as DynamoDB.AttributeValue,
        },
    }

    const results: PromiseResult<QueryOutput, unknown> = await db
        .query(query_params)
        .promise()
    return results.Items && results.Items.length > 0 ? results.Items : false
}

export const updateToken = async (
    id: DynamoDB.AttributeValue,
    token: string
) => {
    const params: any = {
        TableName: TABLE_NAME,
        Key: {
            doc_type: 'USER',
            doc_key: id,
        },
        UpdateExpression: 'set info.jwt = :tkn',
        ExpressionAttributeValues: {
            ':tkn': token,
        },
        ReturnValues: 'UPDATED_NEW',
    }

    const updated: PromiseResult<UpdateItemOutput, unknown> = await db
        .update(params)
        .promise()

    return updated
}
