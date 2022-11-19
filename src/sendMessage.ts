import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from "@aws-sdk/client-apigatewaymanagementapi";

const {
  STAGE,
  REGION,
  CONNECTION_TABLE,
  LOCALSTACK_ENDPOINT,
  PORT
} = process.env;

const getDynamoDbConfig = (): { region: string, endpoint?: string } => {
  if (STAGE === "local") return { region: REGION, endpoint: LOCALSTACK_ENDPOINT };
  return { region: REGION };
}

const getConnectionEndpoint = (event) => {
  return STAGE === "local" ? 
  `http://${event.requestContext.domainName}:${PORT}` :
  `https://${event.requestContext.domainName}/${event.requestContext.stage}/`
}

module.exports.handler = async (event, context, callback) => {
  console.log(event);

  const body = JSON.parse(event.body);

  const dynamoDBClient = new DynamoDBClient(getDynamoDbConfig());

  /**
   * Query the connection table for the TARGET connection record.
   * The recepient's username used in the query will be included in the event body.
   */
  let queryResult = await dynamoDBClient.send(new QueryCommand({
    TableName: CONNECTION_TABLE,
    KeyConditionExpression: "Username = :a",
    ExpressionAttributeValues: {
      ":a": { S: body.recepient}
    }
  }));
  
  // Return early if the recepient is not found in the connections table.
  if (!(queryResult?.Items?.length && queryResult?.Items?.length > 0)) return callback(JSON.stringify({
    message: "Recepient not found",
    queryResult
  }));

  const recepientConnection =  queryResult.Items[0];

  /**
   * Query ConnectionIdIndex using the connection id of the sender.
   * The senders connection id can be found in event.requestContext.connectionId.
   * We retrieve this connection record in order to retrieve the sender's username.
   */
  queryResult = await dynamoDBClient.send(new QueryCommand({
    TableName: CONNECTION_TABLE,
    IndexName: "ConnectionIdIndex",
    KeyConditionExpression: "ConnectionId = :b",
    ExpressionAttributeValues: {
      ":b": { S: event.requestContext.connectionId }
    },
  }));

  // Return early if no actively connected sender is found.
  if (!(queryResult?.Items?.length && queryResult?.Items?.length > 0)) return callback({
    message: "Sender not found"
  });

  const senderConnection = queryResult?.Items ? queryResult.Items[0]: undefined;

  
  const apiGatewayManagementApiClient = new ApiGatewayManagementApiClient({ 
    region: REGION,
    endpoint: getConnectionEndpoint(event)
  });

  // Post a message to the recipient's connection.
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