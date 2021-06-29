import { DynamoDB } from 'aws-sdk'
import { generate } from 'shortid'

let dbopts

if (process.env.NODE_ENV == 'local') {
    dbopts = {
        endpoint: process.env.LOCAL_DYNAMODB || 'http://localhost:8000',
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

interface Props {
    putOutput?: DynamoDB.DocumentClient.PutItemInput
    batchWriteOutput: DynamoDB.DocumentClient.BatchWriteItemOutput
}

interface Person {
    name?: string
    hashed_password: string
    activation_key?: string
}
interface Station {
    name: string
}
interface Record {
    hk: string
    sk: string
    hk2: string
    sk2: string
    delete_at?: number
    created_at?: number
    updated_at?: number
    info: {
        [key: string]: string | number | boolean
    }
}

type KeyType = {
    hk: string
    sk: string
}

type RecordIdentifier = {
    id: string
    model: string
}

type ExpressionAttributeValuesType = {
    [key: string]: string | number | Person | Station
}

const create = async (record: Record): Promise<Record> => {
    const now = Math.round(Date.now() / 1000)
    const Item = {
        created_at: now,
        updated_at: now,
        hk2: generate(),
        ...record,
    }
    const doc: DynamoDB.DocumentClient.PutItemInput = {
        TableName,
        Item,
    }
    await dynamodb.put(doc).promise()
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
): Promise<DynamoDB.DocumentClient.ItemList> => {
    const { Items } = await dynamodb
        .query({
            TableName,
            IndexName,
            KeyConditionExpression,
            ExpressionAttributeValues,
        })
        .promise()
    return Items || []
}

const update = async (
    { hk, sk }: KeyType,
    values: ExpressionAttributeValuesType,
    expression: string[],
    ConditionExpression: string = undefined
): Promise<DynamoDB.DocumentClient.AttributeMap> => {
    const now = Math.round(Date.now() / 1000)
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

const deleteItemAt = async (
    model: string,
    id: string
): Promise<DynamoDB.DocumentClient.BatchWriteItemOutput | void> => {
    const now = Math.round(Date.now() / 1000)
    return await update(
        { hk: model, sk: `${model}#${id}` },
        {
            ':delat': now,
        },
        ['delete_at = :delat']
    )
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
    retrieve,
    update,
    deleteItemAt,
    getById,
    deleteItem,
    Record,
    Person,
}
