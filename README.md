
## Set up local DynamoDB

```
awslocal dynamodb create-table \
--table-name ConnectionTable \
--attribute-definitions AttributeName=Username,AttributeType=S AttributeName=ConnectionId,AttributeType=S \
--key-schema AttributeName=Username,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
--global-secondary-indexes \
  "[
    {
      \"IndexName\": \"ConnectionIdIndex\",
      \"KeySchema\": [
        {
          \"AttributeName\":\"ConnectionId\",
          \"KeyType\":\"HASH\"
        }
      ],
      \"Projection\": {
        \"ProjectionType\":\"ALL\"
      },
      \"ProvisionedThroughput\": {
        \"ReadCapacityUnits\": 1,
        \"WriteCapacityUnits\": 1
      }
    }
  ]"
```
