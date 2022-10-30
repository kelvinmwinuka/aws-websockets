"use strict";

const {
  DynamoDB,
  DeleteItemCommand,
  QueryCommand
} = require("@aws-sdk/client-dynamodb");

const {
  REGION,
  CONNECTION_TABLE
} = process.env;

module.exports.handler = async (event) => {
  console.log(event);

  const dynamoDBClient = new DynamoDB({ region: REGION });

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
  const connectionRecord = queryResult.Items[0];

  const deleteItemCommand = new DeleteItemCommand({
    TableName: CONNECTION_TABLE,
    Key: {
      Username: { S: connectionRecord.Username.S }
    }
  });
  await dynamoDBClient.send(deleteItemCommand);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Connection ended!" })
  };
}