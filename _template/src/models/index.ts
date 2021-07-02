import { generate } from 'shortid'
import {
    create,
    update,
    retrieve,
    deleteItemAt,
    Document,
} from '../utils/dynamodb'

type Model = {
    id: string
    name: string
    created_by?: string
    created_at?: number
    updated_at?: number
}

type ModelInfo = {
    name: string
}

type Filters = {
    name?: string
    created_by?: string
}

type ErrorMap = {
    [key: string]: string
}
type ModelErrorResponse = {
    error?: string
    errors?: ErrorMap
}

const retrieveRecords = async (filters?: Filters) => {
    const docs = await retrieve(
        'hk = :hk and begins_with(sk, :sk)',
        {
            ':hk': '{{model}}',
            ':sk': '{{model}}#',
        }
    )

    const {{service}}: Model[] = []
    docs.map((doc) => {
        if (!doc.delete_at) {
            {{service}}.push({
                id: doc.sk.split('#')[1],
                created_by: doc.hk2.split('#')[0],
                name: doc.info.name,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
            })
        } else {
            console.log(doc)
        }
    })

    return {{service}}
}

const createRecord = async (
    record: Record<string, string | number>,
    created_by: string
): Promise<Model | ModelErrorResponse> => {
    let errors: ErrorMap
    if (!record.name) errors = {
        name: '{{model}}_name_required'
    }
    if (errors) return { errors }
    

    const existing = await getByName(record.name as string)
    if (existing) {
        if (!(existing as ModelErrorResponse).errors) {
            return {
                name: '{{model}}_exists',
            } as ErrorMap
        } else {
            return existing as ModelErrorResponse
        }
    }

    const id: string = generate()
    const { name } = record

    const doc: Document = {
        hk: '{{model}}',
        sk: `{{model}}#${id}`,
        hk2: `user#${created_by}`,
        sk2: name as string,
        info: {
            name,
        },
    }

    const {{model}}: Document = await create(doc)
    return normalize({{model}})
}

const updateRecord = async (
    id: string,
    updates: ModelInfo
): Promise<Model | ModelErrorResponse> => {
    // Validate
    let errors: ErrorMap

    if (!id) {
        errors = {
            id: '{{model}}_id_required',
        }
    }
    if (!updates.name) {
        errors = {
            ...errors,
            name: '{{model}}_name_required',
        }
    }

    if (errors) {
        return { errors }
    }

    const {{model}} = await getById(id)

    if (!{{model}}) {
        errors = {
            ...errors,
            name: '{{model}}_id_invalid',
        }
        throw new Error(`Invalid {{model}} id ${id}`)
    }

    const info: ModelInfo = updates

    await update(
        {
            hk: '{{model}}',
            sk: `{{model}}#${id}`,
        },
        {
            ':i': info,
        },
        ['info = :i']
    )

    return { ...{{model}}, id, ...info }
}

/**
 *
 * @param name
 * @returns {{model}} document
 */
const getByName = async (name: string) => {
    // Validate
    if (!name) {
        throw new Error('"name" is required')
    }

    const [doc] = await retrieve(
        'hk = :hk and sk2 = :sk2',
        { ':hk': '{{model}}', ':sk2': name },
        process.env.dbIndex2
    )

    return normalize(doc as Document)
}

/**
 *
 * @param id DynamoDB hash key (primary key)
 * @returns User document
 */
const getById = async (id: string) => {
    // Validate
    if (id === undefined || !id) {
        throw new Error('"id" is required')
    }

    const [doc] = await retrieve('hk = :hk and sk = :sk', {
        ':hk': '{{model}}',
        ':sk': `{{model}}#${id}`,
    })

    return normalize(doc as Document)
}

const deleteRecord = async (id: string) => {
    return await deleteItemAt('{{model}}', id)
}

const normalize = (doc: Document): Model | void => {
    if (doc) {
        return {
            id: doc.sk.split('#')[1],
            name: doc.info.name as string,
            created_by: doc.hk2.split('#')[0],
            created_at: doc.created_at,
            updated_at: doc.updated_at,
        }
    }
}

export {
    createRecord,
    retrieveRecords,
    updateRecord,
    deleteRecord,
    getById,
    getByName,
}
