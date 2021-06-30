import { Request, Response } from 'express'
import { retrieveStations } from '../models'

export default async (req: Request, res: Response) => {
    const docs = await retrieveStations()
    return res.status(200).json({ docs })
}
