import {
  DynamoDBClient,
  PutItemCommand
} from "@aws-sdk/client-dynamodb";

const {
  REGION,
  CONNECTION_TABLE
} = process.env;

module.exports.handler = async (event) => {
  console.log(event);

  const dynamoDBClient = new DynamoDBClient({ region: REGION });
  const putItemCommand = new PutItemCommand({
    TableName: CONNECTION_TABLE,
    Item: {
      Username: { S: event.queryStringParameters.username },
      ConnectionId: { S: event.requestContext.connectionId }
    }
  });
  await dynamoDBClient.send(putItemCommand);

  return { statusCode: 200 };
}