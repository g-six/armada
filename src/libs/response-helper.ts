import { ResponseErrorTypes, ResponseJsonOutput, ResponseOutput, ResponseSuccessTypes } from 'generics/response-types'

interface JoiErrorDetails {
    message: string
    type: string
    context: {
        key: string
    }
}
export function toErrorResponse(errors: Record<string, unknown>, status_code = 400, headers: Record<string, string> = { 'Content-Type': 'application/json' }): ResponseJsonOutput {
    const response: ResponseOutput = {
        type: ResponseErrorTypes.InvalidRequestHeaders,
        errors,
    }
    let statusCode = status_code

    try {
        const { name, message, type } = errors
        if (type) {
            response.type = type as ResponseErrorTypes
        }
        const { details } = errors as unknown as { details: JoiErrorDetails[] }
        if (details) {
            response.errors = details.map((joi_error: JoiErrorDetails) => {
                const { context, message, type } = joi_error
                return {
                    [context.key]: {
                        type,
                        message,
                    },
                }
            }) as unknown as Record<string, unknown>
        } else {
            response.errors = { [name as string]: message }
        }
        return {
            statusCode,
            headers,
            body: JSON.stringify(response, null, 3) + '\n\n'
        }
    } catch (e) {
        statusCode = 500
        console.log(e)
        return {
            statusCode,
            headers,
            body: JSON.stringify({
                error: 'Unable to process internal server error',
                stack: e,
            }, null, 3) + '\n\n'
        }
    }
}

export function toSuccessResponse(results: Record<string, unknown>, status_code = 200, headers: Record<string, string> = { 'Content-Type': 'application/json' }): ResponseJsonOutput {
    let response: ResponseOutput = {
        type: ResponseErrorTypes.InvalidJsonRequest
    }
    let statusCode = status_code
    try {
        const { message, redirect_to, ...record } = results as Record<string, string>
        response = {
            type: ResponseSuccessTypes.Success,
            record,
            message,
            meta: { redirect_to },
        }
    } catch (e) {
        statusCode = 400
        console.log(e)
    }
    return {
        statusCode,
        headers,
        body: JSON.stringify(response, null, 3) + '\n\n'
    }
}
