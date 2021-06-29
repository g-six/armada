## Toilet Model
| Name            | Type          | Required |
| --------------- |:-------------:| --------:|
| id              | string        |     auto |
| station_id      | string        |     true |
| name            | string        |     true |
| toilet          | string        |     true |
| type            | string        |     true |
| usage_status    | enum          |     true |
| stock           | enum          |     true |
| last_alert      | string        |     true |
| usage_count     | number        |     true |
| reset           | string        |     true |
| cleaning_record | string        |     true |
| created_at      | timestamp     |     auto |
| updated_at      | timestamp     |     auto |