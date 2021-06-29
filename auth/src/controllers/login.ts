import { Request, Response } from 'express'
import { loginUser } from '../models/user'
import { validatePassword } from '../utils/password-helper'

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body
    const errors = []
    if (!email) errors.push({
        field: 'email',
        message: res.locals.locales.jp.email_required,
    })
    if (!password) {
        errors.push({
            field: 'password',
            message: res.locals.locales.jp.password_required,
        })  
    } else if (password.length < 8 || password.length > 20) {
        errors.push({
            field: 'password',
            message: res.locals.locales.jp.password_required,
        })
    } else if (!validatePassword(password)) {
        errors.push({
            field: 'password',
            message: res.locals.locales.jp.password_invalid,
        })
    }

    if (errors.length > 0) {
        return res.status(401).json({
            errors,
        })
    }

    try {
        const { id, token, role, errors } = await loginUser(email, password)

        if (errors) {
            return res.status(401).json({
                error: errors.map((error: string) => (res.locals.locales.jp[error] || error)).join('\n '),
            })
        }
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
