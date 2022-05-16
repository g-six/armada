import * as crypto from 'crypto-js'
import { config } from 'generics/config'
export interface Session {
    id: string
    created_at: number
    issued_at: number
    expires_at: number
}
export function hashCognitoSecret(username: string): string {
    return crypto.enc.Base64.stringify(
        crypto.HmacSHA256(
            username + config.ARMADA_COGNITO_CLIENT_ID,
            crypto.enc.Utf8.parse(config.ARMADA_COGNITO_CLIENT_SECRET ?? ''),
        ),
    )
}