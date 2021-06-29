## Cleaning Job Model
| Name           | Type          | Required | Details                         |
| -------------- |:-------------:| --------:| ------------------------------- |
| id             | string        |     auto |                                 |
| equipment_id   | string        |     true |                                 |
| name           | string        |     true |                                 |
| completed_at   | timestamp     |    false | if this is null, job is pending |
| created_at     | timestamp     |     auto |                                 |
| updated_at     | timestamp     |     auto |                                 |