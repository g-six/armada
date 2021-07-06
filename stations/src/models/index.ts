import { DynamoDB } from 'aws-sdk'
import { generate } from 'shortid'
import {
    create,
    update,
    retrieve,
    Document,
    deleteItemAt,
} from '../utils/dynamodb'

enum PaperStatus {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
}

enum SoapStatus {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
}

enum ToiletAlert {
    OVERSTAY = 'OVERSTAY',
    CONTAMINATED = 'CONTAMINATION',
    SENSOR_UNRESPONSIVE = 'SENSOR_UNRESPONSIVE',
    STOLEN_OR_DAMAGED = 'STOLEN_OR_DAMAGED',
    CLEANING_REQUIRED = 'CLEANING_REQUIRED',
}

interface NewStationRequest {
    name: string
    line: string
    is_controlled?: boolean
}

interface Station extends NewStationRequest {
    id: string
    paper?: PaperStatus
    soap?: SoapStatus
    alert?: ToiletAlert
    toilets?: Record<string, string | number>[]
    created_by?: string
    created_at?: number
    updated_at?: number
}

export type ErrorList = {
    errors: string[]
}

export type CreateFieldErrors = {
    name?: string
    line?: string
}

export type RequestErrorMap = {
    field: string
    message: string
}

export type ErrorMap = {
    error?: string
    errors?: {
        [key: string]: string
    }
}

const retrieveStations = async () => {
    const docs: DynamoDB.DocumentClient.ItemList = await retrieve(
        'hk = :hk and begins_with(sk, :sk)',
        {
            ':hk': 'm_station',
            ':sk': 'station#',
        }
    )

    // Collate toilets for this station
    const toilet_docs: DynamoDB.DocumentClient.ItemList =
        await retrieve('hk = :hk and begins_with(sk, :sk)', {
            ':hk': 'm_toilet',
            ':sk': 'toilet#',
        })
    const toilets: Record<
        string,
        Record<string, string | number>[]
    > = {}
    toilet_docs.forEach((toilet: Document) => {
        const [, station_id, toilet_name] = toilet.sk2.split('#')
        const station_toilets = toilets[station_id]
        if (!station_toilets) {
            toilets[station_id] = []
        }
        toilets[toilet.sk2.split('#')[1]].push({
            ...toilet.info,
            id: toilet.hk2,
            name: toilet_name,
        })
    })

    const stations: Station[] = []
    docs.map((doc: Document) => {
        if (!doc.delete_at) {
            const station = normalize(doc as Document) as Station
            station.toilets = toilets[station.id]
            stations.push(station)
        } else {
            console.log(doc)
        }
    })

    return stations
}

const retrieveToilets = async (id: string) => {
    const toilet_docs: DynamoDB.DocumentClient.ItemList =
        await retrieve('hk = :hk and begins_with(sk, :sk)', {
            ':hk': 'm_toilet',
            ':sk': 'toilet#',
        })
    const toilets: Record<string, string>[] = []
    toilet_docs.forEach((toilet: Document) => {
        const [, station_id, toilet_name] = toilet.sk2.split('#')

        if (station_id == id) {
            toilets.push({
                ...toilet.info,
                id: toilet.hk2,
                name: toilet_name,
            })
        }
    })

    return toilets
}

const retrieveStation = async (id: string) => {
    const doc = await getById(id)

    if (!doc)
        return {
            error: 'station_does_not_exist',
        }
    doc.toilets = await retrieveToilets(id)

    return doc
}

const createStation = async (
    station: NewStationRequest,
    created_by: string
): Promise<Station | ErrorMap> => {
    const { name, line } = station
    const is_controlled = station.is_controlled || false
    let errors: { [key: string]: string }

    if (!name)
        errors = {
            name: 'station_name_required',
        }
    if (!line)
        errors = {
            ...errors,
            line: 'station_line_required',
        }

    if (errors) return { errors }

    const existing = await getByName(name, line)

    if (existing) {
        errors = {
            ...errors,
            name: 'station_exists',
        }
    }

    if (errors) return { errors }

    const id: string = generate()
    const info = {
        paper: PaperStatus.NORMAL as string,
        soap: SoapStatus.NORMAL as string,
        is_controlled,
        created_by,
    }

    const record: Document = {
        hk: 'm_station',
        sk: `station#${id}`,
        hk2: `user#${created_by}`,
        sk2: `${name}#${line}`,
        info,
    }
    const doc = await create(record)

    if (!doc)
        return {
            error: 'create_station_failed',
        }
    return normalize(doc) as Station
}

const updateStation = async (
    id: string,
    updates: Record<string, string | Record<string, string>>
): Promise<Record<string, string> | Station> => {
    // Validate
    if (!id) {
        return {
            error: 'station_id_required',
        }
    }

    const station = await getById(id)

    if (!station) {
        return { error: 'station_does_not_exist' }
    }

    if (!updates.name && !updates.line) {
        return {
            name: 'no_updates_provided',
        }
    }

    const { name: updated_name, line: updated_line } = updates
    const updated_sk2 = [
        station.name as string,
        station.line as string,
    ]

    const update_assignments = []
    let update_values = {}

    if (updated_name) {
        updated_sk2[0] = updated_name as string
        station.name = updated_name as string
    }

    if (updated_line) {
        updated_sk2[1] = updated_line as string
        station.line = updated_line as string
    }

    update_values = {
        ...update_values,
        ':sk2': updated_sk2.join('#'),
    }
    update_assignments.push('sk2 = :sk2')

    console.log(update_values)

    try {
        await update(
            {
                hk: 'm_station',
                sk: `station#${id}`,
            },
            update_values,
            update_assignments
        )
    } catch (e) {
        return { error: e.message, stack: e.stack }
    }

    return station as unknown as Station
}

/**
 *
 * @param name
 * @param line
 * @returns Station document
 */
const getByName = async (name: string, line: string) => {
    const errors: { [key: string]: string }[] = []
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
        { ':hk': 'm_station', ':sk2': `${name}#${line}` },
        process.env.dbIndex2
    )

    return normalize(doc as Document)
}

/**
 *
 * @param id DynamoDB hash key (primary key)
 * @returns User document
 */
const getById = async (id: string): Promise<Station> => {
    // Validate
    if (id === undefined || !id) {
        throw new Error('"id" is required')
    }

    const [doc] = await retrieve('hk = :hk and sk = :sk', {
        ':hk': 'm_station',
        ':sk': `station#${id}`,
    })

    return normalize(doc as Document) as Station
}

const deleteStation = async (id: string): Promise<void> => {
    await deleteItemAt('m_station', id)
}

const normalize = (doc: Document): Station | void => {
    if (doc) {
        const [name, line] = doc.sk2.split('#')
        const [,created_by] = doc.hk2.split('#')
        let info: Record<string, string | boolean> = {
            paper: null,
            soap: null,
            is_controlled: false,
        }
        if (doc.info) {
            info = {
                paper: doc.info.paper as PaperStatus,
                soap: doc.info.soap as SoapStatus,
                is_controlled: doc.info.is_controlled as boolean,
            }
        }
        return {
            ...info,
            id: doc.sk.split('#')[1],
            name,
            line,
            created_by,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
        }
    }
}

export {
    createStation,
    retrieveStations,
    retrieveStation,
    updateStation,
    deleteStation,
    getById,
    getByName,
}
