import * as Rsa from 'node-rsa'

const key = new Rsa(
    ((process.env.CRYPTO_KEY || { b: 512 }) as unknown) as Rsa.KeyBits
)

export const authorize = (token: string) => {
    const message = key.decrypt(token, 'utf8')
    return message ? JSON.parse(message) : ''
}

export default authorize
