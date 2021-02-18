import { HttpMethod } from '@aws-cdk/aws-apigatewayv2'

export interface ILambdaFn {
    name: string
    code: string
    path: string
    method: HttpMethod
}

export interface ILambda {
    name: string
    functions: ILambdaFn[]
}

export { HttpMethod }
