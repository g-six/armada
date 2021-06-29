## Toilet Alert Model
| Name           | Type          | Required | Details                         |
| -------------- |:-------------:| --------:| ------------------------------- |
| id             | string        |     auto |                                 |
| toilet_id      | string        |     true |                                 |
| alert          | enum          |     true | LONG_STAY, CONTAMINATED,        |
|                |               |          | SENSOR_UNRESPONSIVE,            |
|                |               |          | DAMAGED_STOLEN,                 |
| created_at     | timestamp     |     auto |                                 |
| updated_at     | timestamp     |     auto |                                 |