export const transformDoc = (doc: Record<string, unknown>) => {
    const full_name = doc.title as string
    const { token, uniq_id: email } = doc
    const [last_name, first_name] = full_name.split(', ')

    return JSON.stringify(
        {
            doc: {
                id: (doc.doc_key as string).split('#')[1],
                email,
                full_name,
                first_name,
                last_name,
                token,
            },
        },
        null,
        3
    )
}

export const transformMessage = (message: string) =>
    JSON.stringify({ message }, null, 3)
