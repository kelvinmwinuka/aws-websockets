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
  const deleteItemCommand = new DeleteItemCommand({
    TableName: CONNECTION_TABLE,
    Key: {
      ConnectionId: { S: event.requestContext.connectionId }
    }
  });
  await dynamoDBClient.send(deleteItemCommand);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Connection ended!" })
  };
}