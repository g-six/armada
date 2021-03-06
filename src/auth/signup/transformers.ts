

export const transformDoc = (row: Record<string, unknown>) => {
    console.log('Executing transformation of newly inserted doc')
    const { title, title_attr, doc_key, uniq_attr, uniq_id } = row
    const { token } = row.info as unknown as Record<string, unknown>
    const [last_name, first_name] = (title as string).split(', ')

    return JSON.stringify(
        {
            doc: {
                first_name,
                last_name,
                id: (doc_key as string).split('#')[1],
                [(uniq_attr as string).toLowerCase()]: uniq_id,
                [(title_attr as string).toLowerCase()]: title,
                token,
            },
        },
        null,
        3
    )
}

export const transformErrors = (
    errors: Record<string, unknown>[],
    message: string
) => JSON.stringify({ errors, message }, null, 3)
