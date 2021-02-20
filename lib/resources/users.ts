import { ILambdaFn, HttpMethod } from '../types'
const lambdas: ILambdaFn[] = []
lambdas.push({
    name: 'createOneUserFn',
    code: 'create-one',
    path: '/user',
    method: HttpMethod.POST,
})
lambdas.push({
    name: 'getOneUserFn',
    code: 'get-one',
    path: '/user/{id}',
    method: HttpMethod.GET,
})
lambdas.push({
    name: 'getAllUsersFn',
    code: 'get-all',
    path: '/users',
    method: HttpMethod.GET,
})
lambdas.push({
    name: 'updateOneUserFn',
    code: 'update-one',
    path: '/user/{id}',
    method: HttpMethod.PATCH,
})
lambdas.push({
    name: 'deleteOneUserFn',
    code: 'delete-one',
    path: '/user/{id}',
    method: HttpMethod.DELETE,
})
export default lambdas
