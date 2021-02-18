import users from './users'
import { ILambda } from '../types'

const lambdas: ILambda[] = [
    { name: 'users', functions: users },
]

export { lambdas }
