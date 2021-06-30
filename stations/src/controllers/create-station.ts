import { Request, Response } from 'express'
import { User } from '../models/user'
import * as Model from '../models'

const create = async (req: Request, res: Response) => {
    try {
        const { name, line } = req.body
        const user_id = (req.user as User).id

        const doc = await Model.createStation(
            { name, line },
            user_id
        )
        const { errors } = doc as Model.ErrorMap

        let results: Record<string, any> = {}
        let status_code: number = 400
        if (errors) {
            results.errors = {}
            Object.keys(errors).forEach((key: string) => {
                results.errors[key] = res.locals.translateError(
                    errors[key]
                )
            })
        } else {
            status_code = 200
            results = {
                message: 'Record created.',
                doc,
            }
        }
        return res.status(status_code).json(results)
    } catch (error) {
        return res.status(400).json({
            tried: 'create',
            error: error.message,
            stack: error.stack,
        })
    }
}

export default create
