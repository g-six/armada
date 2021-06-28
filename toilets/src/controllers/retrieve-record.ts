import { Request, Response } from 'express'
import { retrieveRecords } from '../models'

export default async (req: Request, res: Response) => {
    const docs = await retrieveRecords()
    return res.status(200).json({ docs })
}
