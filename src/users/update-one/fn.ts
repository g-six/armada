import { DynamoDB } from 'aws-sdk'
import { UpdateItemOutput } from 'aws-sdk/clients/dynamodb'
import { PromiseResult } from 'aws-sdk/lib/request'
const db = new DynamoDB.DocumentClient()
const TABLE_NAME = process.env.TABLE_NAME || ''

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
    DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`,
    INVALID_REQUEST_MISSING_ID_ERROR =
        'invalid request, you are missing the path parameter id',
    INVALID_REQUEST_NO_ARGUMENTS_ERROR =
        'invalid request, no arguments provided',
    INVALID_REQUEST_ERROR =
        'invalid request, you are missing the parameter body'

function transformMessage(message: string) {
    return JSON.stringify({ message }, null, 3)
}

function transformDoc(doc: Record<string, unknown>) {
    return JSON.stringify({ doc }, null, 3)
}

export const handler = async (event: any = {}): Promise<any> => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: transformMessage(INVALID_REQUEST_ERROR),
        }
    }

    const item_id = event.pathParameters.id
    if (!item_id) {
        return {
            statusCode: 400,
            body: transformMessage(INVALID_REQUEST_MISSING_ID_ERROR),
        }
    }

    const item =
        typeof event.body == 'object' ? event.body : JSON.parse(event.body)
    const record: Record<string, unknown> = {}
    const { first_name, last_name, email } = item
    // const now = Date.now()
    if (last_name && first_name) {
        record.title = `${last_name}, ${first_name}`
    }
    if (email) {
        record.uniq_id = email
    }

    const edited_props = Object.keys(record)
    if (!record || edited_props.length < 1) {
        return {
            statusCode: 400,
            body: transformMessage(INVALID_REQUEST_NO_ARGUMENTS_ERROR),
        }
    }

    const first_property = edited_props.splice(0, 1)
    const params: any = {
        TableName: TABLE_NAME,
        Key: {
            doc_type: 'USER',
            doc_key: `u#${item_id}`,
        },
        UpdateExpression: `set ${first_property} = :${first_property}`,
        ExpressionAttributeValues: {},
        ReturnValues: 'UPDATED_NEW',
    }
    params.ExpressionAttributeValues[`:${first_property}`] =
        record[`${first_property}`]

    edited_props.forEach((property) => {
        params.UpdateExpression += `, ${property} = :${property}`
        params.ExpressionAttributeValues[`:${property}`] = record[property]
    })

    try {
        const updated: PromiseResult<
            UpdateItemOutput,
            unknown
        > = await db.update(params).promise()
        return {
            statusCode: 204,
            body: transformDoc((updated as unknown) as Record<string, unknown>),
        }
    } catch (dbError) {
        const message =
            dbError.code === 'ValidationException' &&
            dbError.message.includes('reserved keyword')
                ? DYNAMODB_EXECUTION_ERROR
                : RESERVED_RESPONSE
        return { statusCode: 500, body: transformMessage(message) }
    }
}
