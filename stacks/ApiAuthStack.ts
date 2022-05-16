/* eslint-disable @typescript-eslint/no-explicit-any */
import { DomainName } from '@aws-cdk/aws-apigatewayv2-alpha'
import { StackContext, Api } from '@serverless-stack/resources'
import { domain_props } from './domain-config'

export function ApiAuthStack(this: any, { stack }: StackContext) {
    const api = new Api(stack, 'auth', {
        customDomain: {
            cdk: {
                domainName: DomainName.fromDomainNameAttributes(
                    this,
                    'ApiDomain',
                    domain_props,
                ),
            },
            path: 'auth',
        },
        routes: {
            'POST /login': 'services/auth/controllers/main.login',
            'POST /signup': 'services/auth/controllers/main.signUp',
            'GET /activate': 'services/auth/controllers/main.activate',
        },
    })

    // Show the API endpoint in the output
    this.addOutputs({
        ApiEndpoint: api.url,
    })
}
