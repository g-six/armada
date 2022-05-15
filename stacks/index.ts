import { App } from '@serverless-stack/resources'
import { ArmadaConfig } from 'generics/config'
import { ApiAuthStack } from './ApiAuthStack'

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
} = process.env as ArmadaConfig

const environment: ArmadaConfig = {
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

export default function (app: App) {
    app.setDefaultFunctionProps({
        runtime: 'nodejs16.x',
        srcPath: 'src',
        bundle: {
            format: 'esm',
        },
        environment,
    })

    app.stack(ApiAuthStack)
}
