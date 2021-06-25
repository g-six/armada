const app = require('./src/app')
// import { app } from './src/app'

const server = app.listen(process.env.PORT, () => {
    console.log(`NODE_ENV ${process.env.NODE_ENV}`)
    console.log(`Listening to port ${process.env.PORT}`)
    console.log(`AWS Region ${process.env.region}`)
    console.log(`DynamoDB TableName ${process.env.db}`)
})
