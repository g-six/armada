import { Request, Response } from 'express'
import { updateStation } from '../models'

const update = async (req: Request, res: Response) => {
    const id: string = decodeURIComponent(req.params.id as string)

    try {
        const updates = req.body
        const doc = await updateStation(id, updates)

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
