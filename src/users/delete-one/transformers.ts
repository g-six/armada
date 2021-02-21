export const transformError = (error: Error) => JSON.stringify(error, null, 3)

export const transformMessage = (message: string) =>
    JSON.stringify({ message }, null, 3)
