import { DynamoDB } from 'aws-sdk'
import { generate } from 'shortid'
import {
    create,
    update,
    retrieve,
    Record,
    deleteItemAt,
} from '../utils/dynamodb'

type Station = {
    id: string
    name: string
    line: string
    created_by?: string
    created_at?: number
    updated_at?: number
}

type StationInfo = {
    name: string
}

type StationFilters = {
    name?: string
    created_by?: string
}

export type ErrorList = {
    errors: string[]
}

const retrieveStations = async (filters?: StationFilters) => {
    const docs: DynamoDB.DocumentClient.ItemList = await retrieve(
        'hk = :hk and begins_with(sk, :sk)',
        {
            ':hk': 'station',
            ':sk': 'station#',
        }
    )

    const stations: Station[] = []
    docs.map((doc: Record) => {
        if (!doc.delete_at) {
            stations.push(normalize(doc as Record) as Station)
        } else {
            console.log(doc)
        }
    })

    return stations
}

const createStation = async (
    name: string,
    line: string,
    created_by: string
): Promise<Station | { error: string }> => {
    const existing = await getByName(name, line)
    if (existing) {
        throw new Error(`"${name}" already existing`)
    }

    const id: string = generate()
    const info = { name, created_by }
    const record: Record = {
        hk: 'station',
        sk: `station#${id}`,
        hk2: `user#${created_by}`,
        sk2: `${name}#${line}`,
        info,
    }
    const doc = await create(record)

    if (!doc) return {
        error: 'create_station_failed'
    }
    return normalize(doc) as Station
}

const updateStation = async (
    id: string,
    updates: StationInfo
): Promise<Station> => {
    // Validate
    if (!id) {
        throw new Error('"Station id" is required')
    }

    const errors = []
    if (!updates.name) {
        errors.push({
            name: 'Station name is required.',
        })
    }

    if (errors.length > 0) {
        throw new Error(JSON.stringify({ errors }, null, 4))
    }

    const station = await getById(id)

    if (!station) {
        throw new Error(`Invalid station id ${id}`)
    }

    const info: StationInfo = updates

    await update(
        {
            hk: 'station',
            sk: `station#${id}`,
        },
        {
            ':i': info,
        },
        ['info = :i']
    )

    return { ...station, id, ...info }
}

/**
 *
 * @param name
 * @param line
 * @returns Station document
 */
const getByName = async (name: string, line: string) => {
    const errors: { [key:string]: string }[] = []
    if (!name) {
        errors.push({
            name: 'station_name_required',
        })
    }

    if (!line) {
        errors.push({
            line: 'train_line_required',
        })
    }

    const [doc] = await retrieve(
        'hk = :hk and sk2 = :sk2',
        { ':hk': 'station', ':sk2': `${name}#${line}` },
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
        ':hk': 'station',
        ':sk': `station#${id}`,
    })

    return normalize(doc as Record)
}

const deleteStation = async (id: string) => {
    return await deleteItemAt('station', id)
}

const normalize = (doc: Record): Station | void => {
    if (doc) {
        const [name, line] = doc.sk2.split('#')
        return {
            id: doc.sk.split('#')[1],
            name,
            line,
            created_by: doc.info.created_by as string,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
        }
    }
}

export {
    createStation,
    retrieveStations,
    updateStation,
    deleteStation,
    getById,
    getByName,
}
