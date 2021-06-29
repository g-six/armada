import { Request, Response } from 'express'
import { activateUser } from '../models/user'

const activate = async (req: Request, res: Response) => {
    const { x, y } = req.query
    const key: string = decodeURIComponent(x as string)
    const id: string = decodeURIComponent(y as string)
    console.log(req.query)
    try {
        const { email, token } = await activateUser(key, id)

        return res.status(200).json({
            message:
                'Successfully activated.  Log in using the jwt',
            doc: {
                id,
                email,
                token,
            },
        })
    } catch (e) {
        res.status(400).json({
            error: e.message,
            stack: e.stack.split('\n'),
        })
    }
}

export default activate
