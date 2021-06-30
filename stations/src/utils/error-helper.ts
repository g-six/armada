export type FieldError = {
    message: string
    code: string
}

export const translateError = (
    code: string,
    translate: (Key: string) => string
) => translate(code)

export const translateFieldError = (
    field: string,
    code: string,
    translate: (Key: string) => string
) => ({ field, code, message: translate(code) })

export const translateErrors = (
    errors: FieldError[],
    translate: (Key: string) => string
) => {
    return errors.map(
        (error) =>
            ({
                ...error,
                code: error.code,
                message: translate(error.code),
            } as FieldError)
    )
}
