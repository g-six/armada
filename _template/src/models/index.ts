import { generate } from 'shortid'
import {
    create,
    update,
    retrieve,
    Record,
    deleteItemAt,
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
    name: string,
    created_by: string
): Promise<Model> => {
    const existing = await getByName(name)
    if (existing) {
        throw new Error(`"${name}" already existing`)
    }

    const id: string = generate()
    const info = { name }
    const record: Record = {
        hk: '{{model}}',
        sk: `{{model}}#${id}`,
        hk2: `${created_by}#${id}`,
        sk2: name,
        info,
    }
    const doc = await create(record)
    const {{model}} = {
        id,
        name: doc.sk2,
        created_by: doc.sk.split('#')[1],
        created_at: doc.created_at,
        updated_at: doc.updated_at,
    }
    return {{model}}
}

const updateRecord = async (
    id: string,
    updates: ModelInfo
): Promise<Model> => {
    // Validate
    if (!id) {
        throw new Error('"{{model}} id" is required')
    }

    const errors = []
    if (!updates.name) {
        errors.push({
            name: '{{model}} name is required.',
        })
    }

    if (errors.length > 0) {
        throw new Error(JSON.stringify({ errors }, null, 4))
    }

    const {{model}} = await getById(id)

    if (!{{model}}) {
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

    return normalize(doc as Record)
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

    return normalize(doc as Record)
}

const deleteRecord = async (id: string) => {
    return await deleteItemAt('{{model}}', id)
}

const normalize = (doc: Record): Model | void => {
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
