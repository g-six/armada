import { Request, Response } from 'express'
import { loginUser, ModelErrorResponse, User } from '../models/user'

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body

    try {
        const results = await loginUser(email, password)

        if ((results as ModelErrorResponse).error) {
            const model_error = results as ModelErrorResponse
            console.log(model_error)
            let errors: {
                [key: string]: { code: string; message: string }
            }
            if (errors) {
                Object.keys(model_error.errors).forEach(
                    (key: string) => {
                        const code = model_error.errors[key]
                        const message =
                            res.locals.translateError(code)
                        errors[key] = { code, message }
                    }
                )
            }

            return res.status(401).json({
                error: {
                    code: model_error.error,
                    message: res.locals.translateError(
                        model_error.error
                    ),
                },
                errors,
            })
        }

        const user = results as User
        let link
        if (user.activation_key) {
            link = `activate?x=${encodeURIComponent(
                user.activation_key
            )}&y=${encodeURIComponent(user.id)}&z=${user.role}`
            return res.status(200).json({
                error: {
                    code: 'not_activated',
                    message:
                        res.locals.translateError('not_activated'),
                },
                link,
            })
        }

        return res.status(200).json({
            message: 'Successfully logged in',
            doc: user,
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
