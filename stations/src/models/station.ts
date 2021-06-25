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

const retrieveStations = async (filters?: StationFilters) => {
    const docs = await retrieve(
        'hk = :hk and begins_with(sk, :sk)',
        {
            ':hk': 'station',
            ':sk': 'station#',
        }
    )

    const stations: Station[] = []
    docs.map((doc) => {
        if (!doc.delete_at) {
            stations.push({
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

    return stations
}

const createStation = async (
    name: string,
    created_by: string
): Promise<Station> => {
    const existing = await getByName(name)
    if (existing) {
        throw new Error(`"${name}" already existing`)
    }

    const id: string = generate()
    const info = { name }
    const record: Record = {
        hk: 'station',
        sk: `station#${id}`,
        hk2: `${created_by}#${id}`,
        sk2: name,
        info,
    }
    const doc = await create(record)
    const station = {
        id,
        name: doc.sk2,
        created_by: doc.sk.split('#')[1],
        created_at: doc.created_at,
        updated_at: doc.updated_at,
    }
    return station
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
 * @returns Station document
 */
const getByName = async (name: string) => {
    // Validate
    if (!name) {
        throw new Error('"name" is required')
    }

    const [doc] = await retrieve(
        'hk = :hk and sk2 = :sk2',
        { ':hk': 'station', ':sk2': name },
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
    createStation,
    retrieveStations,
    updateStation,
    deleteStation,
    getById,
    getByName,
}
