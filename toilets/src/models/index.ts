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
    toilet: string
    usage_status: UsageStatus
    usage_count: number
    reset_at: number
    current_job_id?: string
    created_by?: string
    delete_at?: number
    created_at?: number
    updated_at?: number
}

type NewRecord = {
    station_id: string
    name: string
    toilet: string
    created_by: string
}

enum UsageStatus {
    VACANT = 'VACANT',
    OCCUPIED = 'OCCUPIED',
}
type ModelInfo = {
    name: string
    toilet: string
    usage_status: UsageStatus
    usage_count: number
    reset_at: number
    created_by: string
    current_job_id?: string
}

type Filters = {
    name?: string
    created_by?: string
}

const createRecord = async (
    item: NewRecord
): Promise<Model | ErrorMap | void> => {
    const { station_id, name, toilet, created_by } = item

    const existing = await getStationById(station_id)
    if (!existing || (existing as ErrorMap).errors) {
        return existing
    }

    const id: string = generate()

    const info: ModelInfo = {
        name,
        toilet,
        usage_count: 0,
        usage_status: UsageStatus.VACANT,
        reset_at: Math.round(Date.now() / 1000),
        created_by,
    }

    const record: Record = {
        hk: `toilet`,
        sk: `toilet#${id}`,
        hk2: `station#${station_id}`,
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
            ':sk': 'toilet#',
        }
    )

    const toilets: Model[] = []
    docs.map((doc: Record) => {
        if (!doc.delete_at) {
            const toilet = normalize(doc) as Model
            toilets.push(toilet)
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
const getStationById = async (
    station_id: string
): Promise<Model | ErrorMap> => {
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
        const [, id] = doc.sk.split('#')
        const [, station_id] = doc.hk2.split('#')

        return {
            id,
            station_id,
            name: doc.info.name as string,
            toilet: doc.info.toilet as string,
            reset_at: doc.info.reset_at as number,
            usage_status: doc.info.usage_status as UsageStatus,
            usage_count: doc.info.usage_count as number,
            created_by: doc.info.created_by as string,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
        }
    }
}

export {
    ErrorMap,
    NewRecord,
    createRecord,
    retrieveRecords,
    updateRecord,
    deleteRecord,
    getStationById,
    getById,
    getByName,
}
