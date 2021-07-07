import { Request, Response } from 'express'
import * as UserModel from '../models/user'
import {
    sendTemplate,
    Receipient,
    TemplateOptions,
} from '../utils/email-helper'

const protocol: string =
    process.env.NODE_ENV === 'local' ? 'http' : 'https'

const create = async (req: Request, res: Response) => {
    let user: UserModel.User
    let response: Record<
        string,
        string | Record<string, string | Record<string, string>>
    > = {}

    try {
        const { email, password, user_type } = req.body
        const results = await UserModel.createUser(
            email,
            password,
            user_type
        )
        const { errors } = results as UserModel.ModelErrorResponse
        if (errors) {
            let email_error, password_error
            if (errors.email)
                email_error = {
                    code: errors.email,
                    message: res.locals.translateError(
                        errors.email
                    ),
                }
            if (errors.password)
                password_error = {
                    code: errors.password,
                    message: res.locals.translateError(
                        errors.password
                    ),
                }
            response = {
                errors: {
                    email: email_error,
                    password: password_error,
                },
            }
            res.status(400).json(response)
        }

        user = results as UserModel.User

        if (!user)
            res.status(400).json({ error: 'create_user_failed' })
    } catch (error) {
        response = {
            error: error.message,
            stack: error.stack,
        }
        res.status(400).json(response)
    }

    const { id, email, activation_key, name, role } = user

    const link = `${protocol}://${
        req.headers.host
    }/activate?x=${encodeURIComponent(
        activation_key
    )}&y=${encodeURIComponent(id)}&z=${role}`

    const receipient: Receipient = { email, name }

    try {
        const template_opts: TemplateOptions = {
            template_name: 'account-activation',
            subject: '[VACAN] Activate your account!',
            to: [receipient],
            to_name: name,
            bcc_address: 'gerard+vacan@idearobin.com',
            merge_vars: [
                {
                    name: 'name',
                    content: name,
                },
                {
                    name: 'link',
                    content: link,
                },
            ],
        }

        const rs = await sendTemplate(template_opts)
        res.status(200).json({
            message:
                'Sign up successful.  Please activate your account.',
            rs,
            user: {
                id,
                email,
            },
        })
    } catch (error) {
        response = { error: error.message, stack: error.stack }
        res.status(400).json(response)
    }
}

export default create
