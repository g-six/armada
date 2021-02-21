import { APIGatewayProxyEvent } from 'aws-lambda'
import authorize from './auth'
import { transformDoc, transformError, transformMessage } from './transformer'

const INVALID_REQUEST_NO_ARGUMENTS_ERROR =
        'invalid request, no arguments provided',
    TOKEN_EXPIRED = 'Your session has expired, please login again'

export const handler = async (event: APIGatewayProxyEvent): Promise<any> => {
    if (!event.headers || !event.headers.authorization) {
        return {
            statusCode: 400,
            body: transformMessage(INVALID_REQUEST_NO_ARGUMENTS_ERROR),
        }
    }

    const [, token] = event.headers.authorization.split(' ', 2)
    const info = authorize(token)
    if (!info || !info.expires) {
        return {
            statusCode: 403,
            body: transformMessage(INVALID_REQUEST_NO_ARGUMENTS_ERROR),
        }
    }
    if (new Date() >= new Date(info.expires)) {
        return {
            statusCode: 403,
            body: transformMessage(TOKEN_EXPIRED),
        }
    }

    try {
        return {
            statusCode: 200,
            body: transformDoc(info),
        }
    } catch (error) {
        console.error(error)
        return { statusCode: 500, body: transformError(error) }
    }
}
