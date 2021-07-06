# Serverless / Express RESTful API
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Requirements
i. Installed `docker-compose`
ii. Installed NodeJS v14
iii. Installed `aws-cli`
iv. Installed `serverless` npm package

## Installation
To run the microservices locally, the following steps should be undertaken on your local machine.
Create a dot env file (`.env`) at the root of the directory with the following contents

### Environment
```bash
region=ap-northeast-1
profile=idearobin
aws_access_key_id=IDEAROBINDUMMYKEY
aws_secret_access_key=JUSTASAMPLEKEY
token=some-token-to-be-used-in-auth-flow
MANDRILL_API_KEY=ANYFORNOWSINCEYOUWONTBENEEDINGTHISANYWAY
```

### Database
The default database for this framework is AWS DynamoDB but your can use a different tech stack based on your needs (I would recommend Postgres if your are for relational database systems).

Of course, you would need to make some code adjustments to make it work with your Database choice.

Go to the `database` directory to set everything up and create your database via Docker.
```bash
cd database
```

Run the docker container for the offline dynamodb.
```bash
docker-compose up -d
```

### ExpressJS Services using PM2
Go back to the root project folder, copy the ecosystem config sample file, review and update the config, accordingly and run pm2 start
```bash
cd ../
cp ecosystem.config.sample ecosystem.config.js
vim ecosystem.config.js

pm2 start
```

**4. Example APIs**

#### Signup API (to create user)
Sample request
```bash
# POST /signup
curl -X POST "http://localhost:AUTH_PORT/signup" -H 'content-type: application/json' \
    -d '{
        "email": "code+vacan@idearobin.com",
        "password": "sohardtocrack"
    }'
```
Output from sample request, you may use the link `merge_var` below to activate your account.
```json
{
   "message" : "Sign up successful.  Please activate your account.",
   "rs" : {
      "opts" : {
         "bcc_address" : "gerard+vacan@gmail.com",
         "merge_vars" : [
            {
               "name" : "first_name"
            },
            {
               "name" : "last_name"
            },
            {
               "content" : "http://localhost:8888/activate?x=ak.GcDPZrNJps&y=admin%23f8i9As1_B&z=admin",
               "name" : "link"
            }
         ],
         "subject" : "[VACAN] Activate your account!",
         "template_name" : "account-activation",
         "to" : [
            {
               "email" : "code+vacan@idearobin.com",
               "name" : "undefined undefined"
            }
         ],
         "to_name" : "undefined undefined"
      }
   },
   "user" : {
      "email" : "code+vacan@idearobin.com",
      "id" : "admin#f8i9As1_B"
   }
}```

#### Account Activation API
Sample request (the url query below is using the link from the above signup API results)
```bash
# GET /activate
curl "http://localhost:8888/activate?x=ak.GcDPZrNJps&y=admin%23f8i9As1_B&z=admin"
```

Output from sample request, you may use the token as BEARER for any API requests that requires authentication.
```json
{
   "doc" : {
      "email" : "code+vacan@gmail.com",
      "id" : "f8i9As1_B",
      "token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY4aTlBczFfQiIsImlhdCI6MTYyNDQzMzgyNiwiZXhwIjoxNjI1MDM4NjI2fQ.BhfNxY146Q2Fwia8KeVIBmOkMlsWMFIpdd6QWylWzpA"
   },
   "message" : "Successfully activated.  Log in using the jwt"
}```

#### Login API
Sample request
```bash
# POST /login
curl -X POST "http://localhost:8888/login" -H 'content-type: application/json' \
    -d '{
        "email": "code+vacan@gmail.com",
        "password": "sohardtocrack"
    }'
```
Output from sample request, you may use the token as BEARER for any API requests that requires authentication.
```json
{
   "doc" : {
      "email" : "code+vacan@google.com",
      "id" : "1KIz-56L5",
      "role" : "admin",
      "token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFLSXotNTZMNSIsInNlc3Npb25fY3JlYXRlZF9hdCI6MTYyNDQzMzQzODU2OCwiaWF0IjoxNjI0NDMzNDM4LCJleHAiOjE2MjUwMzgyMzh9.78V13aXfJ1R14HGjIo2oC3WfHz11HnVcuVUrHdpvc3c"
   },
   "message" : "Successfully logged in"
}
```

