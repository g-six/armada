import users from './users'
import auth from './auth'
import { ILambda } from '../types'

const lambdas: ILambda[] = [{ name: 'users', functions: users }]
lambdas.push({ name: 'auth', functions: auth })

export { lambdas }
