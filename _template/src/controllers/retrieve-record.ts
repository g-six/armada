import { Request, Response } from 'express'
import { retrieveRecords } from '../models'

export default async (req: Request, res: Response): void => {
    const docs = await retrieveRecords()
    return res.status(200).json({ docs })
}
