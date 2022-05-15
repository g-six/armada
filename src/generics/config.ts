import { CognitoIdentityProviderClientConfig } from '@aws-sdk/client-cognito-identity-provider'

export type ArmadaConfig = {
    ARMADA_ACCESS_KEY_ID: string
    ARMADA_SECRET_ACCESS_KEY: string
    ARMADA_CUSTOM_DOMAIN: string
    ARMADA_API_GATEWAY_DOMAIN: string
    ARMADA_HOSTED_ZONE_ID: string
    ARMADA_COGNITO_POOL_ID: string
    ARMADA_COGNITO_CLIENT_ID: string
    ARMADA_COGNITO_CLIENT_SECRET: string
    ARMADA_SENDGRID_API_KEY: string
}

const {
    ARMADA_ACCESS_KEY_ID,
    ARMADA_SECRET_ACCESS_KEY,
    ARMADA_CUSTOM_DOMAIN,
    ARMADA_API_GATEWAY_DOMAIN,
    ARMADA_HOSTED_ZONE_ID,
    ARMADA_COGNITO_POOL_ID,
    ARMADA_COGNITO_CLIENT_ID,
    ARMADA_COGNITO_CLIENT_SECRET,
    ARMADA_SENDGRID_API_KEY,
} = process.env as Record<string, string>

export const config: ArmadaConfig = {
    ARMADA_ACCESS_KEY_ID,
    ARMADA_SECRET_ACCESS_KEY,
    ARMADA_CUSTOM_DOMAIN,
    ARMADA_API_GATEWAY_DOMAIN,
    ARMADA_HOSTED_ZONE_ID,
    ARMADA_COGNITO_POOL_ID,
    ARMADA_COGNITO_CLIENT_ID,
    ARMADA_COGNITO_CLIENT_SECRET,
    ARMADA_SENDGRID_API_KEY,
}

export const cognito: CognitoIdentityProviderClientConfig = {
    region: ARMADA_COGNITO_POOL_ID.split('_')[0],
    credentials: {
        accessKeyId: ARMADA_ACCESS_KEY_ID,
        secretAccessKey: ARMADA_SECRET_ACCESS_KEY,
    }
}
