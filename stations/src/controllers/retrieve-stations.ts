import { Request, Response } from 'express'
import { retrieveStation, retrieveStations } from '../models'

export const getStation = async (req: Request, res: Response) => {
    const doc = await retrieveStation(req.params.id as string)
    return res.status(200).json({ doc })
}

export default async (req: Request, res: Response) => {
    const docs = await retrieveStations()
    return res.status(200).json({ docs })
}
