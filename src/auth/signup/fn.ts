import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { genSaltSync, hashSync } from 'bcryptjs'
import { DynamoDB } from 'aws-sdk'
import { generate } from 'shortid'
import getToken from './auth'
import getValidationErrors from './validation'
import { transformDoc, transformErrors } from './transformers'

const db = new DynamoDB.DocumentClient()

const TABLE_NAME = process.env.TABLE_NAME || ''

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
    DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`,
    INVALID_REQUEST_ERROR =
        'invalid request, you are missing the parameter body',
    DUPLICATE_ERROR = 'E-mail address already taken'

function transformMessage(message: string) {
    return JSON.stringify({ message }, null, 3)
}

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    let message: string = INVALID_REQUEST_ERROR

    if (!event.body) {
        return {
            statusCode: 400,
            body: transformMessage(message),
        }
    }

    try {
        const item =
            typeof event.body == 'object' ? event.body : JSON.parse(event.body)
        const record: Record<string, unknown> = {}
        const { first_name, last_name, email, password } = item

        const errors: Record<string, unknown>[] = getValidationErrors(
            email,
            password,
            first_name,
            last_name,
            'admin'
        )

        if (errors.length > 0) {
            return { statusCode: 400, body: transformErrors(errors, message) }
        }

        console.log('Preparing input')
        const query_input: DynamoDB.DocumentClient.QueryInput = {
            TableName: TABLE_NAME,
            IndexName: 'gsi3',
            KeyConditionExpression: 'doc_type = :doc_type and uniq_id = :email',
            ExpressionAttributeValues: {
                ':doc_type': 'USER',
                ':email': email,
            },
        }

        console.log('Executing query')
        const existing = await db.query(query_input).promise()
        if (existing.Items && existing.Items.length > 0) {
            message = DUPLICATE_ERROR
            return {
                statusCode: 400,
                body: transformErrors(
                    [
                        {
                            field: 'email',
                            error: 'email taken',
                        },
                    ],
                    message
                ),
            }
        }

        const now = Date.now()
        const permanent_id = generate()
        record.doc_type = 'USER'
        record.group_hash = `#${permanent_id}`
        record.doc_key = `u${record.group_hash}`
        record.title = `${last_name}, ${first_name}`
        record.title_attr = 'FULL_NAME'
        record.uniq_id = email
        record.uniq_attr = 'EMAIL'
        record.created_at = now
        record.updated_at = now
        record.updated_by = permanent_id
        const token = getToken(record)
        record.info = {
            hashword: hashSync(password, genSaltSync(10)),
            token,
        }

        const result = transformDoc(record)

        const params = {
            TableName: TABLE_NAME,
            Item: record,
        }
        console.log('Executing insertion')
        await db.put(params).promise()
        return { statusCode: 201, body: result }
    } catch (error) {
        if (error.code === 'ValidationException') {
            message =
                error.code === 'ValidationException' &&
                error.message.includes('reserved keyword')
                    ? DYNAMODB_EXECUTION_ERROR
                    : RESERVED_RESPONSE
        }

        return {
            statusCode: 400,
            body: transformErrors([error.message, error.stack], message),
        }
    }
}
