export const transformDoc = (doc: Record<string, unknown>) => {
    return JSON.stringify(
        {
            doc,
        },
        null,
        3
    )
}

export const transformError = (error: Error) => JSON.stringify({
    error: error.message,
    stack: error.stack,
}, null, 3)

export const transformMessage = (message: string) =>
    JSON.stringify({ message }, null, 3)
