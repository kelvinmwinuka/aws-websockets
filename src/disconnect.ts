import {
  DynamoDBClient,
  DeleteItemCommand,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";

const {
  REGION,
  CONNECTION_TABLE
} = process.env;

module.exports.handler = async (event, context, callback) => {
  console.log(event);

  const dynamoDBClient = new DynamoDBClient({ region: REGION });

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