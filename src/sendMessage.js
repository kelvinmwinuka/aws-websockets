"use strict";

const {
  DynamoDB,
  QueryCommand,
} = require("@aws-sdk/client-dynamodb");

const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} = require("@aws-sdk/client-apigatewaymanagementapi");

const {
  REGION,
  CONNECTION_TABLE
} = process.env;

module.exports.handler = async (event) => {
  console.log(event);

  const body = JSON.parse(event.body);

  const dynamoDBClient = new DynamoDB({ region: REGION });

  // Get target websocket connection based on recepient stated in message body.
  let queryResult = await dynamoDBClient.send(new QueryCommand({
    TableName: CONNECTION_TABLE,
    KeyConditionExpression: "Username = :a",
    ExpressionAttributeValues: {
      ":a": { S: body.recepient}
    }
  }));
  const recepientConnection = queryResult.Items[0];
  console.log(recepientConnection);

  // Get sender username based on the current connection
  queryResult = await dynamoDBClient.send(new QueryCommand({
    TableName: CONNECTION_TABLE,
    IndexName: "ConnectionIdIndex",
    KeyConditionExpression: "ConnectionId = :b",
    ExpressionAttributeValues: {
      ":b": { S: event.requestContext.connectionId }
    },
  }));
  const senderConnection = queryResult.Items[0];

  // Send message to the connection
  const apiGatewayManagementApiClient = new ApiGatewayManagementApiClient({ 
    region: REGION,
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}/`
  });
  const postToConnectionCommand = new PostToConnectionCommand({
    ConnectionId: recepientConnection.ConnectionId.S,
    Data: Buffer.from(JSON.stringify({
      from: senderConnection.Username.S,
      message: body.message
    }), "utf-8").toString()
  });
  await apiGatewayManagementApiClient.send(postToConnectionCommand);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Message sent succesfully!" })
  };
}