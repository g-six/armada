import { ILambdaFn, HttpMethod } from '../types'
const lambdas: ILambdaFn[] = []

lambdas.push({
    name: 'loginFn',
    code: 'login',
    path: '/login',
    method: HttpMethod.POST,
})
lambdas.push({
    name: 'signupFn',
    code: 'signup',
    path: '/signup',
    method: HttpMethod.POST,
})
lambdas.push({
    name: 'meFn',
    code: 'me',
    path: '/me',
    method: HttpMethod.GET,
})

export default lambdas
