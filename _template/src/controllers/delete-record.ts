import { Request, Response } from 'express'
import { deleteRecord } from '../models'

const fn = async (req: Request, res: Response): void => {
    const { id: record_id } = req.params

    try {
        await deleteRecord(record_id)

        return res.status(200).json({
            message: `Successfully deleted ${record_id}`,
        })
    } catch (e) {
        res.status(400).json({
            error: e.message,
            stack: e.stack.split('\n'),
        })
    }
}

export default fn
