## User Model
| Name           | Type          | Required |
| -------------- |:-------------:| --------:|
| id             | string        |     auto |
| email          | string        |     true |
| role           | string        |     auto |
| hash_password  | string        |     true |
| activation_key | string        |    false |
| created_at     | timestamp     |     auto |
| updated_at     | timestamp     |     auto |
