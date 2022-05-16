import { AdminCreateUserCommand, AdminCreateUserCommandOutput, AdminDisableUserCommand, AdminEnableUserCommand, AdminEnableUserCommandOutput, AdminGetUserCommand, AdminGetUserCommandOutput, AdminSetUserPasswordCommand, AuthFlowType, CognitoIdentityProviderClient, GetUserCommand, InitiateAuthCommand, InitiateAuthCommandInput, InitiateAuthCommandOutput, MessageActionType } from '@aws-sdk/client-cognito-identity-provider'
import { cognito, config } from 'generics/config'
import { ResponseErrorTypes } from 'generics/response-types'
import { hashCognitoSecret } from 'libs/session'

export async function activate(Username: string): Promise<AdminEnableUserCommandOutput | { error: string, message: string }> {
    const client = new CognitoIdentityProviderClient(cognito)

    let record
    try {
        console.log('Activating', Username)
        record = await client.send(
            new AdminEnableUserCommand({
                UserPoolId: config.ARMADA_COGNITO_POOL_ID,
                Username,
            })
        )
    } catch (error) {
        const { name, message } = error as Record<string, string>
        record = { error: name, message }
    }

    return record
}

export async function login(
    email: string,
    password: string
): Promise<AdminGetUserCommandOutput | AdminCreateUserCommandOutput | { error: string }> {
    const client = new CognitoIdentityProviderClient(cognito)

    let record
    try {
        const input: InitiateAuthCommandInput = {
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            ClientId: config.ARMADA_COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
                SECRET_HASH: hashCognitoSecret(email),
            },
        }
        record = await client.send(
            new InitiateAuthCommand(input)
        ) as InitiateAuthCommandOutput
        if (!record.AuthenticationResult) {
            return { error: ResponseErrorTypes.CognitoUserAlreadyExists }
        } else {
            return record
        }
    } catch (error) {
        // We need to catch NotAuthorizedException
        const { message } = error as Record<string, string>
        if (message === ResponseErrorTypes.CognitoIncorrectCredentials) {
            record = { error: 'CognitoIncorrectCredentials' }
        }
    }

    return record || { error: ResponseErrorTypes.InvalidJsonResultSet }
}

export async function signUp(
    email: string,
    password: string
): Promise<AdminGetUserCommandOutput | AdminCreateUserCommandOutput | { error: string }> {
    const client = new CognitoIdentityProviderClient(cognito)

    let record
    try {
        record = await client.send(
            new AdminGetUserCommand({
                UserPoolId: config.ARMADA_COGNITO_POOL_ID,
                Username: email,
            })
        ) as AdminGetUserCommandOutput
        if (!record.Enabled) {
            await setNewPassword(email, password)
        } else {
            return { error: ResponseErrorTypes.CognitoUserAlreadyExists }
        }
    } catch (error) {
        // We need to catch UserNotFoundException
        const { name } = error as Record<string, string>
        if (name === ResponseErrorTypes.CognitoUserNotFound) {
            try {
                // User does not exist so we can proceed and sign up
                record = await client.send(
                    new AdminCreateUserCommand({
                        UserPoolId: config.ARMADA_COGNITO_POOL_ID,
                        Username: email,
                        MessageAction: MessageActionType.SUPPRESS,
                    })
                ) as AdminCreateUserCommandOutput
    
                await setNewPassword(email, password)
            } catch (create_error) {
                console.log(create_error)
            }
        } else {
            record = { error: name }
        }
    }

    return record || { error: ResponseErrorTypes.InvalidJsonResultSet }
}

export async function setNewPassword(
    Username: string,
    Password: string,
): Promise<void> {
    const client = new CognitoIdentityProviderClient(cognito)

    await client.send(
        new AdminSetUserPasswordCommand({
            UserPoolId: config.ARMADA_COGNITO_POOL_ID,
            Username,
            Password,
            Permanent: true,
        })
    )

    await client.send(
        new AdminDisableUserCommand({
            UserPoolId: config.ARMADA_COGNITO_POOL_ID,
            Username,
        })
    )
}