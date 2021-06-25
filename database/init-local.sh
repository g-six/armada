#!/bin/bash
aws dynamodb create-table --endpoint-url http://localhost:8000 \
    --table-name vacan-dev-database \
    --attribute-definitions \
        AttributeName="hk",AttributeType="S" \
        AttributeName="sk",AttributeType="S" \
        AttributeName="hk2",AttributeType="S" \
        AttributeName="sk2",AttributeType="S" \
    --key-schema AttributeName="hk",KeyType="HASH" AttributeName="sk",KeyType="RANGE" \
    --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=5 \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"gsi1\",
                \"KeySchema\": [
                    {\"AttributeName\": \"hk2\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\": \"sk\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {
                    \"ProjectionType\": \"ALL\"
                },
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 10,
                    \"WriteCapacityUnits\": 5
                }
            },
            {
                \"IndexName\": \"gsi2\",
                \"KeySchema\": [
                    {\"AttributeName\": \"hk\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\": \"sk2\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {
                    \"ProjectionType\": \"ALL\"
                },
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 10,
                    \"WriteCapacityUnits\": 5
                }
            }
        ]"