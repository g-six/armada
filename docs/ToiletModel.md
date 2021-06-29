## Toilet Model
| Name            | Type          | Required |
| --------------- |:-------------:| --------:|
| id              | string        |     auto |
| station_id      | string        |     true |
| name            | string        |     true |
| toilet          | string        |     true |
| type            | string        |     true |
| usage_status    | enum          |     true | free, occupied
| stock           | enum          |     true | normal, warning, refill
| usage_count     | number        |     true |
| reset           | string        |     true |
| current_job_id  | string        |     true | 
| created_at      | timestamp     |     auto |
| updated_at      | timestamp     |     auto |

The model has one active / recent job `current_job_id` (see CleaningJobModel)
