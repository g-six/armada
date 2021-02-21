import * as Rsa from 'node-rsa'

const key = new Rsa(
    ((process.env.CRYPTO_KEY || { b: 512 }) as unknown) as Rsa.KeyBits
)

export const getToken = (doc: Record<string, unknown>) => {
    const [last_name, first_name] = (doc.title as string).split(', ')
    // Expires in 2 weeks
    const two_weeks = 1000 * 60 * 60 * 24 * 7 * 2
    return key.encrypt(
        JSON.stringify({
            id: (doc.doc_key as string).split('#')[1],
            email: doc.uniq_id,
            last_name,
            first_name,
            expires: Date.now() + two_weeks,
        }),
        'base64'
    )
}

export default getToken
