import { Request, Response } from 'express'
import { User } from '../models/user'
import * as Model from '../models/station'

const create = async (req: Request, res: Response) => {
    try {
        const { name, line } = req.body
        const user_id = (req.user as User).id
        const results = await Model.createStation(
            { name, line },
            user_id
        )
        const { error, errors: error_list } =
            results as Model.FormErrorResults

        let bad_results
        if (error) {
            bad_results = {
                error: res.locals.locales.jp[error],
            }
        }

        if (error_list) {
            const errors: { [key: string]: string } = {}
            error_list.map((err) => {
                errors[err.field as string] =
                    res.locals.translate(err.message) || err.message
            })
            bad_results = {
                errors,
                ...bad_results,
            }
        }

        if (bad_results) return res.status(400).json(bad_results)

        return res.status(200).json({
            message: 'Record created.',
            doc: results,
        })
    } catch (error) {
        return res.status(400).json({
            tried: 'create',
            error: error.message,
            stack: error.stack,
        })
    }
}

export default create
