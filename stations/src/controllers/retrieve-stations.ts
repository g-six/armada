import { Request, Response } from 'express'
import { retrieveStations } from '../models/station'

export default async (req: Request, res: Response) => {
    const docs = await retrieveStations()
    return res.status(200).json({ docs })
}
