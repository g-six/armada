import { Request, Response } from 'express'
import { loginUser } from '../models/user'
import { validateEmailAddress } from '../utils/email-helper'
import { FieldError } from '../utils/error-helper'
import { validatePassword } from '../utils/password-helper'

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body
    let errors: { [key: string]: string | FieldError } = {}

    if (!email) {
        errors = {
            ...errors,
            email: {
                code: 'email_required',
                message:
                    res.locals.translateError('email_required'),
            },
        }
    } else if (!validateEmailAddress(email)) {
        errors = {
            ...errors,
            email: {
                code: 'email_invalid',
                message: res.locals.translateError('email_invalid'),
            },
        }
    }

    if (!password) {
        errors = {
            ...errors,
            password: {
                code: 'password_required',
                message: res.locals.translateError(
                    'password_required'
                ),
            },
        }
    } else if (!validatePassword(password)) {
        errors = {
            ...errors,
            password: {
                code: 'password_invalid',
                message: res.locals.translateError(
                    'password_invalid'
                ),
            },
        }
    }

    if (errors.email || errors.password) {
        return res.status(401).json({
            errors,
        })
    }

    try {
        const { id, token, role, error } = await loginUser(
            email,
            password
        )

        if (error) {
            return res.status(401).json({
                error: {
                    code: error,
                    message: res.locals.translateError(error),
                },
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
