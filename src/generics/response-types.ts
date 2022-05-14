export enum ResponseErrorTypes {
    Forbidden = 'Forbidden',
    InvalidRequestHeaders = 'InvalidRequestHeaders',
    InvalidJsonRequest = 'InvalidJsonRequest',
    InvalidJsonResultSet = 'InvalidJsonResultSet',
    NotFound = 'NotFound',
    Unauthorized = 'Unauthorized',
}

export enum ResponseSuccessTypes {
    Success = 'Success',
    Empty = 'Empty',
}

export type ResponseOutput = {
    type: ResponseErrorTypes | ResponseSuccessTypes,
    record?: Record<string, unknown>
    records?: Record<string, unknown>[]
    message?: string
    errors?: Record<string, unknown>
}

export type ResponseJsonOutput = {
    statusCode: number
    headers: Record<string, string>,
    body: string
}
