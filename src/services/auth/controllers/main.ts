import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { toErrorResponse, toSuccessResponse } from 'libs/response-helper'

export const signUp: APIGatewayProxyHandlerV2 = async (event) => {
    if (!event.body) return {
        statusCode: 400,
    }
    try {
        return toSuccessResponse({
            message: `Hello, World! Your request was received at ${event.requestContext.time}.`,
            ...event,
            body: JSON.parse(event.body),
        })
    } catch (e) {
        return toErrorResponse(e as Record<string, unknown>)
    }
}
