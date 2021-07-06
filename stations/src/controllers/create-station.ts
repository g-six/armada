import { Request, Response } from 'express'
import { User } from '../models/user'
import * as Model from '../models'
interface IDictionary<TValue> {
    [id: string]: TValue;
}
const create = async (req: Request, res: Response) => {
    try {
        const { name, line } = req.body
        const user_id = (req.user as User).id

        const doc = await Model.createStation(
            { name, line },
            user_id
        )
        const { errors } = doc as Model.ErrorMap

        let results: IDictionary<Record<string, string> | string> = {}
        let status_code = 400
        if (errors) {
            const error_map: Record<string, string> = {}
            Object.keys(errors).forEach((key: string) => {
                error_map[key] = res.locals.translateError(
                    errors[key]
                )
            })
            results = {
                errors: error_map,
            }
        } else {
            status_code = 200
            results = {
                message: 'Record created.',
                doc: doc as Record<string, string>,
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
