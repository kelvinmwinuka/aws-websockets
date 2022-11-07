import {
  DynamoDBClient,
  PutItemCommand
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

module.exports.handler = async (event) => {
  console.log(event);

  const dynamoDBClient = new DynamoDBClient(getDynamoDbConfig());
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