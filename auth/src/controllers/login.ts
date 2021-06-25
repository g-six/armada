import { Request, Response } from 'express'
import { loginUser } from '../models/user'

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body
    if (!password) {
        return res.status(401).json({
            message: 'Please provide your password.',
        })
    }
    try {
        const { id, token, role } = await loginUser(email, password)

        return res.status(200).json({
            message: 'Successfully logged in',
            doc: {
                id,
                email,
                token,
                role,
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
}

export default login
