import { Response } from 'express'
import { logoutUser, UserRequest } from '../models/user'

const logout = async (req: UserRequest, res: Response) => {
    try {
        const { id } = await logoutUser(req.user.id)

        return res.status(200).json({
            message: 'Successfully logged out',
            doc: {
                id,
            },
        })
    } catch (e) {
        res.status(400).json({
            error: e.message,
            stack: e.stack
                .split('\n')
                .map((line: string) => `> ${line}`),
        })
    }
    res.status(201).json({})
}

export default logout
