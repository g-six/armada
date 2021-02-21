export const transformDoc = (row: Record<string, unknown>) => {
    const { title, title_attr, doc_key, uniq_attr, uniq_id } = row
    const [last_name, first_name] = (title as string).split(', ')
    return JSON.stringify(
        {
            doc: {
                first_name,
                last_name,
                id: (doc_key as string).split('#')[1],
                [(uniq_attr as string).toLowerCase()]: uniq_id,
                [(title_attr as string).toLowerCase()]: title,
            },
        },
        null,
        3
    )
}

export const transformError = (error: Error) => JSON.stringify(error, null, 3)

export const transformMessage = (message: string) =>
    JSON.stringify({ message }, null, 3)
