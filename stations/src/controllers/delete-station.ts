import { Request, Response } from 'express'
import { deleteStation } from '../models/station'

const fn = async (req: Request, res: Response) => {
    const { id: station_id } = req.params

    try {
        const docs = await deleteStation(station_id)

        return res.status(200).json({
            message: `Successfully deleted ${station_id}`,
        })
    } catch (e) {
        res.status(400).json({
            error: e.message,
            stack: e.stack.split('\n'),
        })
    }
}

export default fn
