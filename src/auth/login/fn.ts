import { DynamoDB } from 'aws-sdk'
import { QueryOutput } from 'aws-sdk/clients/dynamodb'
import { PromiseResult } from 'aws-sdk/lib/request'
import { compareSync } from 'bcryptjs'
import * as Rsa from 'node-rsa'

const db = new DynamoDB.DocumentClient()
const TABLE_NAME = process.env.TABLE_NAME || ''
const key = new Rsa(
    ((process.env.CRYPTO_KEY || { b: 512 }) as unknown) as Rsa.KeyBits
)

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
    DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`,
    INVALID_REQUEST_NO_ARGUMENTS_ERROR =
        'invalid request, no arguments provided',
    INVALID_REQUEST_ERROR =
        'invalid request, you are missing the parameter body'

function transformMessage(message: string) {
    return JSON.stringify({ message }, null, 3)
}

function transformDoc(doc: Record<string, unknown>) {
    const full_name = doc.title as string
    const [last_name, first_name] = full_name.split(', ')
    const two_weeks = 1000 * 60 * 60 * 24 * 7 * 2
    const token = key.encrypt(
        JSON.stringify({
            email: doc.uniq_id,
            last_name,
            first_name,
            expires: Date.now() + two_weeks,
        }),
        'base64'
    )
    return JSON.stringify(
        {
            doc: {
                email: doc.uniq_id,
                full_name,
                first_name,
                last_name,
                token,
                id: (doc.doc_key as string).split('#')[1],
            },
        },
        null,
        3
    )
}

export const handler = async (event: any = {}): Promise<any> => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: transformMessage(INVALID_REQUEST_ERROR),
        }
    }

    const item =
        typeof event.body == 'object' ? event.body : JSON.parse(event.body)

    if (!item.email) {
        return {
            statusCode: 400,
            body: transformMessage(INVALID_REQUEST_NO_ARGUMENTS_ERROR),
        }
    }

    const query_params: DynamoDB.QueryInput = {
        TableName: TABLE_NAME,
        IndexName: 'gsi3',
        KeyConditionExpression: 'doc_type = :doc_type and uniq_id = :uniq_id',
        ExpressionAttributeValues: {
            ':uniq_id': item.email,
            ':doc_type': 'USER' as DynamoDB.AttributeValue,
        },
    }

    try {
        const results: PromiseResult<QueryOutput, unknown> = await db
            .query(query_params)
            .promise()

        if (!results.Items || results.Items.length == 0) {
            return {
                statusCode: 403,
                body: '{"message": "Invalid login information"}',
            }
        }

        const { hashword } = JSON.parse(results.Items[0].info as string)

        if (!item.password || !compareSync(item.password, hashword)) {
            return {
                statusCode: 403,
                body: '{"message": "Invalid login information"}',
            }
        }

        return {
            statusCode: 200,
            body: transformDoc(results.Items[0]),
        }
    } catch (error) {
        console.error(error)
        const message =
            error.code === 'ValidationException' &&
            error.message.includes('reserved keyword')
                ? DYNAMODB_EXECUTION_ERROR
                : RESERVED_RESPONSE
        return { statusCode: 500, body: transformMessage(message) }
    }
}
