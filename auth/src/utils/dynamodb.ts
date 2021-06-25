import { DynamoDB } from 'aws-sdk'
import { generate } from 'shortid'

let dbopts

if (process.env.NODE_ENV == 'local') {
    dbopts = {
        endpoint: 'http://localhost:8000',
        region: process.env.region,
    }
} else {
    dbopts = {
        region: process.env.region,
    }
}
console.log(dbopts)

const dynamodb = new DynamoDB.DocumentClient(dbopts)
const TableName: string = process.env.db as string

type DynamoKeyValuePair = {
    [key: string]:
        | string
        | number
        | Person
        | Station
        | Toilet
        | ToiletEquipment
        | CleaningJob
        | { DeleteRequest: { Key: string } }[]
}

interface Person {
    name?: string
    hashed_password: string
    activation_key?: string
}
interface Station {
    name: string
}
interface Toilet {
    name: string
}
interface ToiletEquipment {
    name: string
}
interface CleaningJob {
    name: string
}
interface Record {
    hk: string
    sk: string
    hk2: string
    sk2: string
    created_at: number
    updated_at: number
    info: {
        [key: string]: string | number
    }
}

type KeyType = {
    hk: string
    sk: string
}

type ExpressionAttributeValuesType = {
    [key: string]: string | number | Person
}

const create = async (record: Record): Promise<Record> => {
    const now = Date.now()
    const Item = {
        created_at: now,
        updated_at: now,
        hk2: generate(),
        ...record,
    }
    await dynamodb
        .put({
            TableName,
            Item,
        })
        .promise()
    return Item
}

const getById = async (
    Key: DynamoDB.DocumentClient.Key
): Promise<DynamoDB.DocumentClient.ItemResponse> => {
    return await dynamodb.get({ TableName, Key }).promise()
}

const retrieve = async (
    KeyConditionExpression: string,
    ExpressionAttributeValues: ExpressionAttributeValuesType,
    IndexName: string = null
): Promise<DynamoDB.DocumentClient.QueryOutput> => {
    return await dynamodb
        .query({
            TableName,
            IndexName,
            KeyConditionExpression,
            ExpressionAttributeValues,
        })
        .promise()
}

const update = async (
    { hk, sk }: KeyType,
    values: ExpressionAttributeValuesType,
    expression: string[],
    ConditionExpression: string = undefined
): Promise<
    DynamoDB.DocumentClient.AttributeMap | DynamoKeyValuePair
> => {
    const now = Date.now()
    const ExpressionAttributeValues = {
        ...values,
        ':dt': now,
    }
    const UpdateExpression = `set ${expression.join(
        ', '
    )}, updated_at = :dt`
    try {
        const { Attributes } = await dynamodb
            .update({
                TableName,
                Key: {
                    hk,
                    sk,
                },
                ExpressionAttributeValues,
                UpdateExpression,
                ConditionExpression,
                ReturnValues: 'ALL_NEW',
            })
            .promise()
        return Attributes
    } catch (e) {
        console.error(e)
        return {
            error: e.message,
            stack: e.stack,
            ExpressionAttributeValues,
            UpdateExpression,
        }
    }
}

const deleteItem = async (
    hk: string,
    sk: string,
    ConditionExpression: string = undefined,
    ExpressionAttributeValues: string[] = undefined
): Promise<void> => {
    await dynamodb
        .delete({
            TableName,
            Key: {
                hk,
                sk,
            },
            ConditionExpression,
            ExpressionAttributeValues,
        })
        .promise()
}

export {
    create,
    getById,
    retrieve,
    update,
    deleteItem,
    Record,
    Person,
}
