/**
 * Config: Passport.js
 */
import { PassportStatic } from 'passport'
import {
    ExtractJwt as ExtractJWT,
    Strategy as StrategyJWT,
    StrategyOptions,
} from 'passport-jwt'

import * as UserModel from '../models/user'

export { ExtractJWT }

export default (passport: PassportStatic): void => {
    const options: StrategyOptions = {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    }
    options.secretOrKey = process.env.token
    passport.use(
        new StrategyJWT(options, async (jwtPayload, done) => {
            let user
            try {
                const {
                    created_at,
                    email,
                    updated_at,
                    role,
                    token,
                } = await UserModel.getById(jwtPayload.id)

                const { session_created_at, exp } = jwtPayload
                const expires_at = new Date(exp * 1000).getTime()
                const logged_in_at = new Date(
                    new Date().setTime(session_created_at)
                ).getTime()
                user = {
                    created_at,
                    expires_at,
                    exp,
                    email,
                    logged_in_at,
                    updated_at,
                    role,
                    token,
                }
            } catch (error) {
                return done(error, null, {
                    message: 'invalid session',
                })
            }

            if (!user || !user.token) {
                return done(null, false, {
                    message: 'invalid session',
                })
            }
            return done(null, { ...user, id: jwtPayload.id })
        })
    )
}
