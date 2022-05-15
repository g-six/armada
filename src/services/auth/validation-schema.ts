import Joi from 'joi'

export const signup_schema = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2 })
        .required()
        .messages({
            'string.email': 'INVALID_EMAIL',
        }),
    password: Joi.string()
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{7,})/,
        )
        .required()
        .messages({
            'string.pattern.base': 'PASSWORD_WEAK',
            'any.required': 'PASSWORD_REQUIRED',
        }),
    role_id: Joi.string(),
})