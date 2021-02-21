const getValidationErrors = (
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    user_type: string
) => {
    const errors = []

    if (!email)
        errors.push({
            field: 'email',
            error: 'Valid email required.',
        })

    if (!password || password.length < 6)
        errors.push({
            error:
                'Valid password with minimum length of 6 characters is required.',
            field: 'password',
        })

    if (!first_name)
        errors.push({
            field: 'first_name',
            error: 'First name required',
        })

    if (!last_name)
        errors.push({
            field: 'last_name',
            error: 'Last name required',
        })

    if (!user_type)
        errors.push({
            field: 'user_type',
            error: 'Admin or basic type',
        })

    return errors
}

export default getValidationErrors
