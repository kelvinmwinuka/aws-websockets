import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from "@aws-sdk/client-apigatewaymanagementapi";

const {
  REGION,
  CONNECTION_TABLE
} = process.env;

module.exports.handler = async (event, context, callback) => {
  console.log(event);

  const body = JSON.parse(event.body);

  const dynamoDBClient = new DynamoDBClient({ region: REGION });

  // Get target websocket connection based on recepient stated in message body.
  let queryResult = await dynamoDBClient.send(new QueryCommand({
    TableName: CONNECTION_TABLE,
    KeyConditionExpression: "Username = :a",
    ExpressionAttributeValues: {
      ":a": { S: body.recepient}
    }
  }));
  
  if (!(queryResult?.Items?.length && queryResult?.Items?.length > 0)) return callback(JSON.stringify({
    message: "Recepient not found",
    queryResult
  }));

  const recepientConnection =  queryResult.Items[0];

  // Get sender username using the current connection id
  queryResult = await dynamoDBClient.send(new QueryCommand({
    TableName: CONNECTION_TABLE,
    IndexName: "ConnectionIdIndex",
    KeyConditionExpression: "ConnectionId = :b",
    ExpressionAttributeValues: {
      ":b": { S: event.requestContext.connectionId }
    },
  }));

  if (!(queryResult?.Items?.length && queryResult?.Items?.length > 0)) return callback({
    message: "Sender not found"
  });

  const senderConnection = queryResult?.Items ? queryResult.Items[0]: undefined;

  // Send message to the connection
  const apiGatewayManagementApiClient = new ApiGatewayManagementApiClient({ 
    region: REGION,
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}/`
  });
  const postToConnectionCommand = new PostToConnectionCommand({
    ConnectionId: recepientConnection?.ConnectionId.S,
    Data: Buffer.from(JSON.stringify({
      from: senderConnection?.Username.S,
      message: body.message
    }), "utf-8")
  });
  await apiGatewayManagementApiClient.send(postToConnectionCommand);

  return { 
    statusCode: 200,
    body: JSON.stringify({ message: "Message sent." })
  };
}