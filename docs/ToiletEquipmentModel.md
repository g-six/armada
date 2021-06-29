## Toilet Equipment Model

| Name          |   Type    | Required | Details                                 |
| ------------- | :-------: | -------: | --------------------------------------- |
| id            |  string   |     auto |                                         |
| name          |  string   |     true |                                         |
| toilet_id     |  string   |     true |                                         |
| type          |   enum    |     true | 'tissue', 'soap'                        |
| supply_status |   enum    |     true | '長期滞在', '汚損', 'センサ反応なし'    |
|               |           |          | '破損・盗難', '要清掃'                  |
| floorplan_url |  string   |     true |                                         |
| created_at    | timestamp |     auto | unix                                    |
| updated_at    | timestamp |     auto |                                         |
