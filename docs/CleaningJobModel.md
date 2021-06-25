## Cleaning Job Model
| Name           | Type          | Required | Details                        |
| -------------- |:-------------:| --------:| ------------------------------ |
| id             | string        |     auto |                                |
| equipment_id   | string        |     true |                                |
| name           | string        |     true |                                |
| status         | enum          |     true | 'pending', 'completed'         |
| created_at     | timestamp     |     auto |                                |
| updated_at     | timestamp     |     auto |                                |