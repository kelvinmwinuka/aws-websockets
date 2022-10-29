"use strict";

const {
  DynamoDB,
  PutItemCommand
} = require("@aws-sdk/client-dynamodb");

const {
  REGION,
  CONNECTION_TABLE
} = process.env;

module.exports.handler = async (event, context) => {
  console.log(event);

  const dynamoDBClient = new DynamoDB({ region: REGION });
  const putItemCommand = new PutItemCommand({
    TableName: CONNECTION_TABLE,
    Item: {
      Username: { S: event.queryStringParameters.username },
      ConnectionId: { S: event.requestContext.connectionId }
    }
  });
  await dynamoDBClient.send(putItemCommand);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Connection established!"
    })
  };
}