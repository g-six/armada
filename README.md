### README
# Armada API v2
Please check regularly for updates or changes.

## Header payload
Please pass `-H 'content-type: application/json'`.

Also, some routes would also need JWT tokens, so you need to pass `-H 'authorization: Bearer <token from successful login>`.
These routes will have an `*` as indicators.

## [Auth / User](docs/USERS.md)
1. [Sign up](docs/USERS.md#register)  
   ```sh
   curl -X POST /users/register
   ```
2. [Activate user](docs/USERS.md#activate)  
   ```sh
   curl /users/activate?x=&y=&z=
   ```
3. [Login](docs/USERS.md#login)   
   ```sh
   curl -X POST /users/login
   ```
4. [Recover account](docs/USERS.md#account-recovery)  
   ```sh
   curl -X POST /users/forgot-password

   # Then use the token created from the above request
   # as BEARER, to submit PATCH request below

   curl -X PATCH /users/password
   ```
    
---   
**Some of these routes will rely on JWT tokens.  You can get the tokens by logging in.**

