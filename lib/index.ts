import {
    Construct,
    CfnOutput,
    RemovalPolicy,
    Stack,
    StackProps,
} from '@aws-cdk/core'
import { HttpApi } from '@aws-cdk/aws-apigatewayv2'
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as lambda from '@aws-cdk/aws-lambda'

import { ILambda, HttpMethod } from './types'
import { lambdas } from './resources'

export class ArmadaDynamoStack extends Stack {
    public readonly url_output: CfnOutput
    private db: dynamodb.Table
    private http_api: HttpApi

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props)

        this.buildDatabase()

        this.url_output = new CfnOutput(this, 'Url', {
            value: this.buildGateway().apiEndpoint,
        })
        console.log(this.url_output)
    }

    private buildDatabase() {
        this.db = new dynamodb.Table(this, 'items', {
            partitionKey: {
                name: 'doc_type',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'doc_key',
                type: dynamodb.AttributeType.STRING,
            },
            tableName: 'armada-db',
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            // The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
            // the new table, and it will remain in your account until manually deleted. By setting the policy to
            // DESTROY, cdk destroy will delete the table (even if it has data in it)
            removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
        })

        this.db.addGlobalSecondaryIndex({
            indexName: 'gsi1',
            partitionKey: {
                name: 'doc_type',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'title',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        })

        this.db.addGlobalSecondaryIndex({
            indexName: 'gsi2',
            partitionKey: {
                name: 'doc_type',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'group_hash',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        })

        this.db.addGlobalSecondaryIndex({
            indexName: 'gsi3',
            partitionKey: {
                name: 'doc_type',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'uniq_id',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        })
    }

    private buildGateway(): HttpApi {
        this.http_api = new HttpApi(this, 'ArmadaDynamoAPI', {
            corsPreflight: {
                allowOrigins: ['*'],
            },
        })

        // Build API Gateway routes for our defined resources
        lambdas.forEach((resource: ILambda) => {
            const { functions, name: resource_name } = resource

            functions.forEach(({ name: func_name, code, path, method }) => {
                const fn = new lambda.Function(this, func_name, {
                    code: new lambda.AssetCode(
                        `lambdas/${resource_name}/${code}`
                    ),
                    handler: 'fn.handler',
                    runtime: lambda.Runtime.NODEJS_12_X,
                    environment: {
                        TABLE_NAME: this.db.tableName,
                        PRIMARY_KEY: 'doc_type',
                        SECONDARY_KEY: 'doc_key',
                    },
                })
                this.db.grantReadWriteData(fn)
                this.http_api.addRoutes({
                    path,
                    methods: [method as HttpMethod],
                    integration: new LambdaProxyIntegration({
                        handler: fn,
                    }),
                })
            })
        })
        return this.http_api
    }
}
