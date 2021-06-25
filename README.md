## Serverless RESTful API
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

### Requirements
i. Installed `docker-compose`
ii. Installed NodeJS v14
iii. Installed `aws-cli`
iv. Installed `serverless` npm package

### Installation
To run the microservices locally, the following steps should be undertaken on your local machine.
Create a dot env file (`.env`) at the root of the directory with the following contents
```bash
region=ap-northeast-1
profile=idearobin
aws_access_key_id=IDEAROBINDUMMYKEY
aws_secret_access_key=JUSTASAMPLEKEY
token=somerandomtoken
MANDRILL_API_KEY=ANYFORNOWSINCEYOUWONTBENEEDINGTHISANYWAY
```

Go to the `database` directory
```bash
cd database
```

Run the docker container for the offline dynamodb.
```bash
docker-compose up -d
```

Go to any microservices directory (for example: `auth` directory) and run the dev server
```bash
cd ../auth
npm run dev
```

#### Signup API (to create user)
Sample request
```bash
# POST /signup
curl -X POST "http://localhost:8888/signup" -H 'content-type: application/json' \
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
         "bcc_address" : "gerard+vacan@idearobin.com",
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
      "email" : "code+vacan@idearobin.com",
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
        "email": "code+vacan@idearobin.com",
        "password": "sohardtocrack"
    }'
```
Output from sample request, you may use the token as BEARER for any API requests that requires authentication.
```json
{
   "doc" : {
      "email" : "code+vacan@idearobin.com",
      "id" : "1KIz-56L5",
      "role" : "admin",
      "token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFLSXotNTZMNSIsInNlc3Npb25fY3JlYXRlZF9hdCI6MTYyNDQzMzQzODU2OCwiaWF0IjoxNjI0NDMzNDM4LCJleHAiOjE2MjUwMzgyMzh9.78V13aXfJ1R14HGjIo2oC3WfHz11HnVcuVUrHdpvc3c"
   },
   "message" : "Successfully logged in"
}
```

#### User profile API
Sample request. The BEARER token here users the results from the above login request
```bash
# GET /me
curl "http://localhost:8888/me" \
    -H 'content-type: application/json' \
    -H 'authorization: BEARER eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFLSXotNTZMNSIsInNlc3Npb25fY3JlYXRlZF9hdCI6MTYyNDQzMzQzODU2OCwiaWF0IjoxNjI0NDMzNDM4LCJleHAiOjE2MjUwMzgyMzh9.78V13aXfJ1R14HGjIo2oC3WfHz11HnVcuVUrHdpvc3c'
```

Output from sample request
```json
{
   "created_at" : 1624431681832,
   "email" : "gerard@idearobin.com",
   "exp" : 1625038238,
   "expires_at" : 1625038238000,
   "id" : "1KIz-56L5",
   "logged_in_at" : 1624433438568,
   "role" : "admin",
   "token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFLSXotNTZMNSIsInNlc3Npb25fY3JlYXRlZF9hdCI6MTYyNDQzMzQzODU2OCwiaWF0IjoxNjI0NDMzNDM4LCJleHAiOjE2MjUwMzgyMzh9.78V13aXfJ1R14HGjIo2oC3WfHz11HnVcuVUrHdpvc3c",
   "updated_at" : 1624433438568
}
```
