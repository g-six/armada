import { APIGatewayProxyEvent } from 'aws-lambda'
import * as Rsa from 'node-rsa'

const key = new Rsa(
    ((process.env.CRYPTO_KEY || { b: 512 }) as unknown) as Rsa.KeyBits
)

const TOKEN_EXPIRED = 'Your session has expired, please login again'

export const authorize = ({ headers }: APIGatewayProxyEvent) => {
    if (!headers.authorization)
        return {
            error: 'No auth token specified',
        }
    const [, token] = headers.authorization.split(' ', 2)
    const decrypted = key.decrypt(token, 'utf8')
    const info =
        typeof decrypted == 'object' ? decrypted : JSON.parse(decrypted)
    if (!info || !info.expires) {
        return {
            error: TOKEN_EXPIRED,
        }
    }
    if (new Date() >= new Date(info.expires)) {
        return {
            error: TOKEN_EXPIRED,
        }
    }

    return info
}

export default authorize
