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
    station_id: string
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

const createRecord = async (
    name: string,
    station_id: string,
    created_by: string
): Promise<Model | ErrorMap | void> => {
    const existing = await getStationById(station_id)
    if (!existing || ((existing as ErrorMap).errors)) {
        return existing
    }

    const id: string = generate()
    const info = { name }
    const record: Record = {
        hk: `toilet`,
        sk: `station#${station_id}#${id}`,
        hk2: `${created_by}#${id}`,
        sk2: name,
        info,
    }
    const doc = await create(record)
    return normalize(doc as Record)
}

const retrieveRecords = async (filters?: Filters) => {
    const docs = await retrieve(
        'hk = :hk and begins_with(sk, :sk)',
        {
            ':hk': 'toilet',
            ':sk': 'station#',
        }
    )

    const toilets: Model[] = []
    docs.map((doc) => {
        if (!doc.delete_at) {
            const [,station_id,id] = doc.sk.split('#')
            toilets.push({
                id,
                station_id,
                created_by: doc.hk2.split('#')[0],
                name: doc.info.name,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
            })
        } else {
            console.log(doc)
        }
    })

    return toilets
}

const updateRecord = async (
    id: string,
    updates: ModelInfo
): Promise<Model> => {
    // Validate
    if (!id) {
        throw new Error('"toilet id" is required')
    }

    const errors = []
    if (!updates.name) {
        errors.push({
            name: 'toilet name is required.',
        })
    }

    if (errors.length > 0) {
        throw new Error(JSON.stringify({ errors }, null, 4))
    }

    const toilet = await getById(id)

    if (!toilet) {
        throw new Error(`Invalid toilet id ${id}`)
    }

    const info: ModelInfo = updates

    await update(
        {
            hk: 'toilet',
            sk: `toilet#${id}`,
        },
        {
            ':i': info,
        },
        ['info = :i']
    )

    return { ...toilet, id, ...info }
}

/**
 *
 * @param name
 * @returns toilet document
 */
const getByName = async (name: string) => {
    // Validate
    if (!name) {
        throw new Error('"name" is required')
    }

    const [doc] = await retrieve(
        'hk = :hk and sk2 = :sk2',
        { ':hk': 'toilet', ':sk2': name },
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
        ':hk': 'toilet',
        ':sk': `toilet#${id}`,
    })

    return normalize(doc as Record)
}

const deleteRecord = async (id: string) => {
    return await deleteItemAt('toilet', id)
}

type FieldError = {
    [key: string]: string
}
type ErrorMap = {
    errors: FieldError | null
}
/**
 * 
 * @param station_id 
 * @returns station record
 */
const getStationById = async (station_id: string): Promise<Model | ErrorMap> => {
    const Errors: ErrorMap = { errors: null }
    // Validate
    if (station_id === undefined || !station_id) {
        Errors.errors.station_id = '"station_id" is required'
    }

    if (Errors.errors) return Errors as ErrorMap

    const [doc] = await retrieve('hk = :hk and sk = :sk', {
        ':hk': 'station',
        ':sk': `station#${station_id}`,
    })

    return normalize(doc as Record) as Model
}

const normalize = (doc: Record): Model | void => {
    if (doc) {
        const [, station_id, id] =  doc.sk.split('#')
        return {
            id,
            station_id,
            name: doc.info.name as string,
            created_by: doc.hk2.split('#')[0],
            created_at: doc.created_at,
            updated_at: doc.updated_at,
        }
    }
}

export {
    ErrorMap,
    createRecord,
    retrieveRecords,
    updateRecord,
    deleteRecord,
    getStationById,
    getById,
    getByName,
}
