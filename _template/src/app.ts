import * as express from 'express'
import * as passport from 'passport'
import * as jwt from 'jsonwebtoken'
import { readFileSync, readdirSync } from 'fs-extra'

import configurePassport, { ExtractJWT } from './config/passport'
import createRecord from './controllers/create-record'
import retrieveRecords from './controllers/retrieve-record'
import updateRecord from './controllers/update-record'
import deleteRecord from './controllers/delete-record'
import { getByIdAndToken, UserRequest } from './models/user'


const app = express()
type NestedData = {
    [key: string]: string | number
}
type func = (
    req: express.Request | UserRequest,
    res: express.Response,
    next?: express.NextFunction
) => Promise<express.Response<any, Record<string, NestedData>>>
// Enable CORS
app.use(
    (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', '*')
        res.header('Access-Control-Allow-Headers', '*')
        res.header('x-powered-by', 'apiarmada')
        next()
    }
)

try {
    configurePassport(passport)
} catch (e) {
    console.log('Passport error')
    console.error(e)
}

// Enable JSON use
app.use(express.json())

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize())
app.use(passport.session())

// Since Express doesn't support error handling of promises out of the box,
// this handler enables that
const asyncHandler =
    (fn: func) =>
    (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        try {
            return Promise.resolve(fn(req, res, next)).catch(next)
        } catch (e) {
            console.error(e)
            res.status(500).send(
                'An internal server error occurred'
            )
        }
    }

type LocaleKeyValuePair = {
    [key: string]: string
}

const langs = readdirSync(`${__dirname}/locales`)
const locales: LocaleKeyValuePair = {}

langs.forEach((lang: string) => {
    locales[lang] = JSON.parse(
        readFileSync(
            `${__dirname}/locales/${lang}/translation.json`,
            { encoding: 'utf8', flag: 'r' }
        )
    )
})

const getLocales = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    res.locals.locales = locales
    res.locals.translateError = (code: string) =>
        (locales.jp as unknown as { [key: string]: string })[
            code as string
        ]
    next()
}

const tokenValidationHandler = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    const bearer = ExtractJWT.fromAuthHeaderAsBearerToken()(req)
    try {
        jwt.verify(bearer, process.env.token)
        const decoded = jwt.decode(bearer) as jwt.JwtPayload
        const user = await getByIdAndToken(decoded.id, bearer)
        if (!user) {
            return res
                .status(401)
                .json({ error: `Invalid token ${bearer}` })
        }
    } catch (e) {
        return res.status(401).json({
            error: `Caught exception Invalid token ${bearer}`,
            stack: [e.message].concat(e.stack.split('\n ')),
        })
    }
    next()
}

// Routes
// You may remove tokenValidationHandler and passport middleware
// if you do not implement authentication in these routes
app.post(
    '/{{service}}',
    asyncHandler(tokenValidationHandler),
    passport.authenticate('jwt', { session: false }),
    getLocales,
    asyncHandler(createRecord)
)
app.get(
    '/{{service}}',
    asyncHandler(tokenValidationHandler),
    passport.authenticate('jwt', { session: false }),
    getLocales,
    asyncHandler(retrieveRecords)
)
app.put(
    '/{{model}}/:id',
    asyncHandler(tokenValidationHandler),
    passport.authenticate('jwt', { session: false }),
    getLocales,
    asyncHandler(updateRecord)
)
app.delete(
    '/{{model}}/:id',
    asyncHandler(tokenValidationHandler),
    passport.authenticate('jwt', { session: false }),
    getLocales,
    asyncHandler(deleteRecord)
)
app.get('/*', (req, res) => {
    res.send(`Request received: ${req.method} - ${req.path}`)
})

// Error handler
type HttpException = {
    status: number
    message: string
    stack: string
}
type ErrorRequestHandler = (
    err: HttpException,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => void
const errorMiddleware: ErrorRequestHandler = (
    err: HttpException,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    console.error(err)
    console.log('')
    console.log('')
    console.log('')
    res.status(500).json({
        error: 'An internal server error occurred',
        stack: [`${err.message}`].concat(err.stack.split('\n')),
    })
}

app.use(errorMiddleware)

module.exports = app
/*
// Reason behind the exports above instead of the below
export default app // This causes error in serverless
{
    "errorType": "Error",
    "errorMessage": "Unsupported framework",
    "stack": [
        "Error: Unsupported framework",
        "    at getFramework (/var/task/_express/node_modules/serverless-http/lib/framework/get-framework.js:69:9)",
        "    at module.exports (/var/task/_express/node_modules/serverless-http/serverless-http.js:14:21)",
        "    at Object.<anonymous> (/var/task/_express/handler.js:47:16)",
        "    at Module._compile (internal/modules/cjs/loader.js:999:30)",
        "    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)",
        "    at Module.load (internal/modules/cjs/loader.js:863:32)",
        "    at Function.Module._load (internal/modules/cjs/loader.js:708:14)",
        "    at Module.require (internal/modules/cjs/loader.js:887:19)",
        "    at require (internal/modules/cjs/helpers.js:74:18)",
        "    at Runtime.exports.handler (/var/task/_serverless/handler.js:33:20)"
    ]
}
 */
