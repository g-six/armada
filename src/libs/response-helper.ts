import { ResponseErrorTypes, ResponseJsonOutput, ResponseOutput, ResponseSuccessTypes } from 'generics/response-types'

export function toErrorResponse(errors: Record<string, unknown>, status_code = 400, headers = { 'Content-Type': 'application/json' }): ResponseJsonOutput {
    const response: ResponseOutput = {
        type: ResponseErrorTypes.InvalidRequestHeaders,
        errors,
    }
    let statusCode = status_code
    try {
        const { name, message } = errors
        response.errors = { [name as string]: message }
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

export function toSuccessResponse(results: Record<string, unknown>, status_code = 200, headers = { 'Content-Type': 'application/json' }): ResponseJsonOutput {
    let response: ResponseOutput = {
        type: ResponseErrorTypes.InvalidJsonRequest
    }
    let statusCode = status_code
    try {
        response = {
            type: ResponseSuccessTypes.Success,
            record: results,
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
