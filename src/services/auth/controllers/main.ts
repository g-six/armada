import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { toErrorResponse, toSuccessResponse } from 'libs/response-helper'
import SGMail from '@sendgrid/mail'
import { encode, TAlgorithm } from 'jwt-simple'
import { signup_schema } from 'services/auth/validation-schema'
import * as model from 'services/auth/models'
import { config } from 'generics/config'
import { Session } from 'libs/session'
import { AdminCreateUserCommandOutput, AdminGetUserCommandOutput } from '@aws-sdk/client-cognito-identity-provider'
import { ResponseErrorTypes } from 'generics/response-types'
import { sendTemplate } from 'libs/sendgrid-helper'
import { decode, JwtPayload } from 'jsonwebtoken'

export const activate: APIGatewayProxyHandlerV2 = async (event) => {
    if (!event.queryStringParameters?.t) return {
        statusCode: 400
    }
    try {
        const { t: token, redirect } = event.queryStringParameters
        const data = decode(token) as JwtPayload
        const expires = new Intl.DateTimeFormat(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/Vancouver',
            timeZoneName: 'short',
        }).format(new Date(data.expires_at))

        let headers
        let status = 301
        if (data.expires_at < Date.now()) {
            headers = { Location: decodeURIComponent(redirect + 'auth/signup?msg=ACTIVATION_LINK_EXPIRED') }
            return toErrorResponse({
                name: 'token',
                message: 'TOKEN_HAS_EXPIRED',
                type: ResponseErrorTypes.InvalidToken,
            }, status, headers)
        }
        const results = await model.activate(data.id)

        if (redirect) {
            if (results) {
                status = 302
                headers = { Location: decodeURIComponent(redirect + 'auth/login?msg=ACTIVATED') }
            } else {
                headers = { Location: decodeURIComponent(redirect + 'auth/signup?msg=ACTIVATION_LINK_EXPIRED') }
            }
        }
        return toSuccessResponse({
            data,
            expires,
        }, status, headers)
    } catch (e) {
        return toErrorResponse(e as Record<string, unknown>)
    }
}

export const signUp: APIGatewayProxyHandlerV2 = async (event) => {
    if (!event.body) return {
        statusCode: 400,
    }
    try {
        const { email, password } = await signup_schema.validateAsync(
            JSON.parse(event.body), { abortEarly: false }
        )

        const record = await model.signUp(email, password)
        const exception = record as { error: string }
        const created = record as AdminCreateUserCommandOutput
        const existing = record as AdminGetUserCommandOutput
        let user_id

        if (created.User && created.User.Username) {
            user_id = created.User.Username
        } else if (existing && existing.Username) {
            user_id = existing.Username
        } else {
            return toErrorResponse({
                type: ResponseErrorTypes.Unauthorized,
                message: exception.error || 'Error in sign up.',
            })
        }

        const session: Session = {
            id: user_id,
            issued_at: Date.now(),
            created_at: Date.now(),
            expires_at: Date.now() + (10 * 60 * 1000),
        }

        const algorithm: TAlgorithm = 'HS512'
        const activation_token = encode(
            session,
            config.ARMADA_COGNITO_CLIENT_SECRET,
            algorithm
        )

        SGMail.setApiKey(config.ARMADA_SENDGRID_API_KEY)
        let url = `https://${config.ARMADA_CUSTOM_DOMAIN}/auth/activate?`
        if (event.headers.referer) {
            url = `${url}redirect=${encodeURIComponent(event.headers.referer)}`
            console.log(url)
        }
        url = `${url}&t=${activation_token}`

        await sendTemplate(
            'd-3ec759e22ea24af9803a7a7420d6e222',
            'Account Activation',
            { email },
            `<p>Please copy and paste the url below to your browser to activate your account.</p><p>${encodeURIComponent(
                url,
            )}</p>`,
            { url }
        )

        return toSuccessResponse({
            message: `Hello, World! Your request was received at ${event.requestContext.time}.`,
            record,
        })
    } catch (e) {
        return toErrorResponse(e as Record<string, unknown>)
    }
}
