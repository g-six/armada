import { Request, Response } from 'express'
import { updateRecord } from '../models'

const update = async (req: Request, res: Response): void => {
    const id: string = decodeURIComponent(req.params.id as string)

    try {
        const updates = req.body
        const doc = await updateRecord(id, updates)

        return res.status(200).json({
            message: 'Successfully updated',
            doc,
        })
    } catch (e) {
        res.status(400).json({
            error: e.message,
            stack: e.stack.split('\n'),
        })
    }
}

export default update
