import { compareSync } from 'bcryptjs'
import getToken from './auth'
import { query, updateToken } from './database'
import { transformDoc } from './transformers'

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
    DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`,
    INVALID_REQUEST_NO_ARGUMENTS_ERROR =
        'invalid request, no arguments provided',
    INVALID_REQUEST_ERROR =
        'invalid request, you are missing the parameter body'

function transformMessage(message: string) {
    return JSON.stringify({ message }, null, 3)
}

export const handler = async (event: any = {}): Promise<any> => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: transformMessage(INVALID_REQUEST_ERROR),
        }
    }

    const { email, password } =
        typeof event.body == 'object' ? event.body : JSON.parse(event.body)

    if (!email || !password) {
        return {
            statusCode: 400,
            body: transformMessage(INVALID_REQUEST_NO_ARGUMENTS_ERROR),
        }
    }

    try {
        const results = await query(email)
        if (!results) {
            return {
                statusCode: 403,
                body: '{"message": "Invalid login information"}',
            }
        }

        const { hashword } = (results[0].info as unknown) as Record<
            string,
            unknown
        >

        if (!compareSync(password, hashword as string)) {
            return {
                statusCode: 403,
                body: '{"message": "Invalid login information"}',
            }
        }

        const { sk } = results[0]
        console.log('Results: ')
        console.log(results)

        const token = getToken(results[0])

        const updated = await updateToken(sk, token)

        return {
            statusCode: 200,
            body: transformDoc({
                ...results[0],
                token,
            }),
        }
    } catch (error) {
        console.error(error)
        const message =
            error.code === 'ValidationException' &&
            error.message.includes('reserved keyword')
                ? DYNAMODB_EXECUTION_ERROR
                : error.message
        return { statusCode: 500, body: transformMessage(message) }
    }
}
