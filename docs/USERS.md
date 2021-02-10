# Auth / User

### Register
POST /users/register
```
{
  "email": <valid email address>,
  "password": <your password>,
}
```

### Activate
GET /users/activate?x=<activation key>&y=<email address>&z=<user type>


### Login
POST /users/login
```
{
  "email": <valid email address>,
  "password": <your password>
}
```

### Profile
```
GET /user
```

### Update profile
```
PATCH /user
```

### Account recovery
```
POST /users/forgot-password
{
  "email": <valid email address>
}

// Then use the token created from the above request
// as BEARER, to submit PATCH request below

PATCH /users/password
{
  "new_password": "",
  "confirm_password": ""
}
```
