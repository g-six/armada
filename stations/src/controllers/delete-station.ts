import { Request, Response } from 'express'
import { deleteStation } from '../models'

const deleteRequest = async (req: Request, res: Response): Promise<Response> => {
    const { id: station_id } = req.params
    let results: Record<string, string>
    try {
        await deleteStation(station_id)
        results = {
            message: `Successfully deleted ${station_id}`,
        }

        res.status(200).json(results)
    } catch (e) {
        results = {
            error: e.message,
            stack: e.stack.split('\n'),
        }
        res.status(400).json(results)
    }
    return res
}

export default deleteRequest
