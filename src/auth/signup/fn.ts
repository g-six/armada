import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { genSaltSync, hashSync } from 'bcryptjs'
import { DynamoDB } from 'aws-sdk'
import { generate } from 'shortid'
import * as Rsa from 'node-rsa'

const db = new DynamoDB.DocumentClient()

const TABLE_NAME = process.env.TABLE_NAME || ''
const key = new Rsa(
    ((process.env.CRYPTO_KEY || { b: 512 }) as unknown) as Rsa.KeyBits
)

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
    DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`,
    INVALID_REQUEST_ERROR =
        'invalid request, you are missing the parameter body',
    DUPLICATE_ERROR = 'E-mail address already taken'

function transformMessage(message: string) {
    return JSON.stringify({ message }, null, 3)
}

function transformDoc(row: Record<string, unknown>) {
    const { title, title_attr, doc_key, uniq_attr, uniq_id } = row
    const [last_name, first_name] = (title as string).split(', ')
    // Expires in 2 weeks
    const two_weeks = 1000 * 60 * 60 * 24 * 7 * 2
    const token = key.encrypt(
        JSON.stringify({
            email: uniq_id,
            last_name,
            first_name,
            expires: Date.now() + two_weeks,
        }),
        'base64'
    )

    return JSON.stringify(
        {
            doc: {
                first_name,
                last_name,
                id: (doc_key as string).split('#')[1],
                [(uniq_attr as string).toLowerCase()]: uniq_id,
                [(title_attr as string).toLowerCase()]: title,
                token,
            },
        },
        null,
        3
    )
}

function transformError(errors: Array<string>, message: string) {
    return JSON.stringify({ errors, message }, null, 3)
}

function transformItem(item: Record<string, unknown>) {
    return JSON.stringify(item, null, 3)
}

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    let message: string = INVALID_REQUEST_ERROR
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: transformMessage(message),
            }
        }
        const item =
            typeof event.body == 'object' ? event.body : JSON.parse(event.body)
        const record: Record<string, unknown> = {}
        const { first_name, last_name, email, password } = item

        const errors = []
        if (!first_name) errors.push('first_name')
        if (!last_name) errors.push('last_name')
        if (!email) errors.push('email')
        if (!password) errors.push('password')

        const query_input: DynamoDB.DocumentClient.QueryInput = {
            TableName: TABLE_NAME,
            IndexName: 'gsi3',
            KeyConditionExpression: 'doc_type = :doc_type and uniq_id = :email',
            ExpressionAttributeValues: {
                ':doc_type': 'USER',
                ':email': email,
            },
        }
        const existing = await db.query(query_input).promise()
        if (existing.Items && existing.Items.length > 0) {
            message = DUPLICATE_ERROR
            errors.push('email taken')
        }

        if (errors.length > 0) {
            return { statusCode: 400, body: transformError(errors, message) }
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

        const info: Record<string, unknown> = {
            hashword: hashSync(password, genSaltSync(10)),
        }

        record.info = transformItem(info)

        const params = {
            TableName: TABLE_NAME,
            Item: record,
        }

        await db.put(params).promise()
        return { statusCode: 200, body: transformDoc(record) }
    } catch (error) {
        if (error.code === 'ValidationException') {
            message =
                error.code === 'ValidationException' &&
                error.message.includes('reserved keyword')
                    ? DYNAMODB_EXECUTION_ERROR
                    : RESERVED_RESPONSE
        }
        return {
            statusCode: 500,
            body: transformError([error.message, error.stack], message),
        }
    }
}
