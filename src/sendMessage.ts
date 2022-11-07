import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from "@aws-sdk/client-apigatewaymanagementapi";

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

  const body = JSON.parse(event.body);

  const dynamoDBClient = new DynamoDBClient(getDynamoDbConfig());

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
    
    endpoint: STAGE === "local" ? 
    `http://${event.requestContext.domainName}:3001` : 
    `https://${event.requestContext.domainName}/${event.requestContext.stage}/`
  });
  const postToConnectionCommand = new PostToConnectionCommand({
    ConnectionId: recepientConnection?.ConnectionId.S,
    Data: Buffer.from(JSON.stringify({
      from: senderConnection?.Username.S,
      message: body.message
    }), "utf-8")
  });
  try{
    await apiGatewayManagementApiClient.send(postToConnectionCommand);
  } catch (error) {
    console.log(error);
  }

  return { 
    statusCode: 200,
    body: JSON.stringify({ message: "Message sent." })
  };
}