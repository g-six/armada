import { DynamoDB } from 'aws-sdk'
import { generate } from 'shortid'
import {
    create,
    update,
    retrieve,
    Record,
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

enum FacilityAlert {
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
    paper: PaperStatus
    soap: SoapStatus
    facility_alert?: FacilityAlert
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

    const record: Record = {
        hk: 'station',
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
    console.log(doc)
    if (doc) {
        const [name, line] = doc.sk2.split('#')
        return {
            id: doc.sk.split('#')[1],
            name,
            line,
            paper: doc.info.paper as PaperStatus,
            soap: doc.info.soap as SoapStatus,
            is_controlled: doc.info.is_controlled as boolean,
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
