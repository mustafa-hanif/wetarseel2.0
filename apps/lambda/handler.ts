import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { prefix } from "dynamodb-toolbox/transformers/prefix";
import { Entity } from "dynamodb-toolbox/entity";
import { Table } from "dynamodb-toolbox/table";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const dynamoDBClient = new DynamoDBClient({
  // region: "me-central-1", // Replace with your region
  region: "localhost",
  endpoint: "http://localhost:8000", // Default port for DynamoDB Local
  credentials: {
    accessKeyId: "ggevny", // Can be anything for local
    secretAccessKey: "r2q3sh", // Can be anything for local
  },
});

export const connection = item({
  id: string().key().transform(prefix("CONNECTION")).savedAs("pk"),
  connectionId: string().key().transform(prefix("CONNECTION")).savedAs("sk"),
  userId: string(),
  connectedAt: string(),
  domain: string(),
  stage: string(),
});

export const userConnection = item({
  /**
   * User id
   */
  id: string().key().transform(prefix("USER")).savedAs("pk"),
  userId: string().key().transform(prefix("USER")).savedAs("sk"),
  connectionId: string(),
});

export const WeTable = new Table({
  name: "WeTable",
  partitionKey: { name: "pk", type: "string" },
  sortKey: { name: "sk", type: "string" },
  documentClient: DynamoDBDocumentClient.from(dynamoDBClient),
});

export const Connection = new Entity({
  name: "CONNECTION",
  table: WeTable,
  schema: connection,
});

export const UserConnection = new Entity({
  name: "USER_CONNECTION",
  table: WeTable,
  schema: userConnection,
});

interface OnConnectEvent {
  requestContext: {
    connectionId: string;
    domainName: string;
    stage: string;
  };
  queryStringParameters: {
    userId: string;
  };
}

interface OnConnectResponse {
  statusCode: number;
}

const onconnect = async (event: OnConnectEvent): Promise<OnConnectResponse> => {
  const connectionId = event.requestContext.connectionId;
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const userId = event.queryStringParameters.userId;

  Connection.build(PutItemCommand)
    .item({
      id: connectionId,
      connectionId: connectionId,
      connectedAt: new Date().toISOString(),
      userId: userId,
      domain: domain,
      stage: stage,
    })
    .send();

  await UserConnection.build(PutItemCommand)
    .item({
      id: userId,
      userId: userId,
      connectionId: connectionId,
    })
    .send();

  return { statusCode: 200 };
};

const ondisconnect = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const { Item } = await Connection.build(GetItemCommand)
    .key({ id: connectionId as string, connectionId: connectionId as string })
    .send();

  await Connection.build(DeleteItemCommand)
    .key({
      id: connectionId as string,
      connectionId: connectionId as string,
    })
    .send();

  if (Item?.userId) {
    await UserConnection.build(DeleteItemCommand)
      .key({ id: Item.userId, userId: Item.userId })
      .send();
  }

  return { statusCode: 200 };
};

const onmessage = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const message = JSON.parse(event.body);

  // Here you would typically process the message and send a response back to the client
  // For example, you could broadcast the message to all connected clients

  const apiGwClient = new ApiGatewayManagementApiClient({
    endpoint: `https://99afqhaebh.execute-api.me-central-1.amazonaws.com/production`,
  });

  await apiGwClient.send(
    new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: new TextEncoder().encode(
        JSON.stringify({
          from: connectionId,
          message,
        })
      ),
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Message received: ${message}` }),
  };
};

export { onconnect, ondisconnect, onmessage };
