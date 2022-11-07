import {
  DynamoDBClient,
  DeleteItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";

const {
  STAGE,
  REGION,
  CONNECTION_TABLE,
  LOCALSTACK_ENDPOINT
} = process.env;

const getDynamoDbConfig = (): { region: string, endpoint?: string } => {
  if (STAGE === "local") return { region: REGION, endpoint: LOCALSTACK_ENDPOINT };
  return { region: REGION };
}

module.exports.handler = async (event, context, callback) => {
  console.log(event);

  const dynamoDBClient = new DynamoDBClient(getDynamoDbConfig());

  // Retrieve the connection using the connectionId
  const queryCommand = new QueryCommand({
    TableName: CONNECTION_TABLE,
    IndexName: "ConnectionIdIndex",
    KeyConditionExpression: "ConnectionId = :a",
    ExpressionAttributeValues: {
      ":a": { S: event.requestContext.connectionId }
    }
  })
  
  const queryResult = await dynamoDBClient.send(queryCommand);
  const connectionRecord = queryResult?.Items ? queryResult.Items[0] : undefined;

  const deleteItemCommand = new DeleteItemCommand({
    TableName: CONNECTION_TABLE,
    Key: {
      Username: { S : connectionRecord?.Username?.S ? connectionRecord?.Username?.S : "" }
    }
  });
  await dynamoDBClient.send(deleteItemCommand);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Connection ended!" })
  };
}