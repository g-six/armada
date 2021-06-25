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
    try {
        const { email, password, user_type } = req.body
        user = await UserModel.createUser(
            email,
            password,
            user_type
        )
        if (!user) throw new Error('Unable to create user')
    } catch (error) {
        return res.status(400).json({
            tried: 'Users.register',
            error: error.message,
            stack: error.stack,
        })
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

        return res.status(200).json({
            message:
                'Sign up successful.  Please activate your account.',
            rs,
            user: {
                id,
                email,
            },
        })
    } catch (error) {
        return res
            .status(400)
            .json({ error: error.message, stack: error.stack })
    }
}

export default create