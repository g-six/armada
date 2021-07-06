import { Request, Response } from 'express'
import { User } from '../models/user'
import * as Model from '../models'

const create = async (req: Request, res: Response): void => {
    try {
        const { name } = req.body
        const user_id = (req.user as User).id
        const doc = await Model.createRecord(name, user_id)
        if (!doc) throw new Error('Unable to create')

        return res.status(200).json({
            message: 'Record created.',
            doc,
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
