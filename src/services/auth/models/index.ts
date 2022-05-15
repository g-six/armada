import { AdminCreateUserCommand, AdminCreateUserCommandOutput, AdminDisableUserCommand, AdminGetUserCommand, AdminGetUserCommandOutput, AdminSetUserPasswordCommand, CognitoIdentityProviderClient, MessageActionType } from '@aws-sdk/client-cognito-identity-provider'
import { cognito, config } from 'generics/config'
import { ResponseErrorTypes } from 'generics/response-types'

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