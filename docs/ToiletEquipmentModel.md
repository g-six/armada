## Toilet Equipment Model
| Name           | Type          | Required | Details                        |
| -------------- |:-------------:| --------:| ------------------------------ |
| id             | string        |     auto |                                |
| name           | string        |     true |                                |
| toilet_id      | string        |     true |                                |
| type           | enum          |     true | 'room', 'paper', 'soap'        |
| floorplan_url  | string        |     true |                                |
| created_at     | timestamp     |     auto | unix                               |
| updated_at     | timestamp     |     auto |                                |