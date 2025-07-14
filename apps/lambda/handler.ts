import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table } from "dynamodb-toolbox/table";
import { Entity } from "dynamodb-toolbox/entity";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { prefix } from "dynamodb-toolbox/transformers/prefix";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

// Environment-aware DynamoDB client configuration
const isLocal =
  process.env.AWS_SAM_LOCAL === "true" || process.env.DYNAMODB_ENDPOINT;

const dynamoDBClient = new DynamoDBClient(
  isLocal
    ? {
        region: "localhost",
        endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
        credentials: {
          accessKeyId: "ggevny", // Can be anything for local
          secretAccessKey: "r2q3sh", // Can be anything for local
        },
      }
    : {
        region: process.env.AWS_REGION || "me-central-1",
      }
);

export const connection = item({
  id: string().key().transform(prefix("CONNECTION")).savedAs("pk"),
  connectionId: string().key().savedAs("sk"), // Remove prefix for sk
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
  userId: string().key().savedAs("sk"), // Remove prefix for sk
  connectionId: string(),
});

export const WeTable = new Table({
  name: process.env.DYNAMODB_TABLE_NAME || "WeTable",
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
  try {
    console.log("OnConnect event:", JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const userId = event.queryStringParameters?.userId || "anonymous";

    console.log("Connecting user:", userId, "with connectionId:", connectionId);
    console.log("Table name:", process.env.DYNAMODB_TABLE_NAME);

    const connectionItem = {
      id: connectionId,
      connectionId: connectionId,
      connectedAt: new Date().toISOString(),
      userId: userId,
      domain: domain,
      stage: stage,
    };
    console.log(
      "Connection item to store:",
      JSON.stringify(connectionItem, null, 2)
    );

    const connectionResult = await Connection.build(PutItemCommand)
      .item(connectionItem)
      .send();
    console.log(
      "Connection stored result:",
      JSON.stringify(connectionResult, null, 2)
    );

    const userConnectionItem = {
      id: userId,
      userId: userId,
      connectionId: connectionId,
    };
    console.log(
      "UserConnection item to store:",
      JSON.stringify(userConnectionItem, null, 2)
    );

    const userConnectionResult = await UserConnection.build(PutItemCommand)
      .item(userConnectionItem)
      .send();
    console.log(
      "UserConnection stored result:",
      JSON.stringify(userConnectionResult, null, 2)
    );

    console.log("Successfully stored connection for user:", userId);
    return { statusCode: 200 };
  } catch (error) {
    console.error("Error in onconnect:", error);
    return { statusCode: 500 };
  }
};

const ondisconnect = async (event: {
  requestContext: { connectionId: string };
}) => {
  try {
    console.log("OnDisconnect event:", JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    console.log("Disconnecting connectionId:", connectionId);

    // Get the connection record to find the userId
    console.log("Looking up connection with keys:", {
      id: connectionId,
      connectionId: connectionId,
    });
    const { Item } = await Connection.build(GetItemCommand)
      .key({ id: connectionId as string, connectionId: connectionId as string })
      .send();

    console.log("Found connection item:", JSON.stringify(Item, null, 2));

    // Delete the connection record
    console.log("Deleting connection with keys:", {
      id: connectionId,
      connectionId: connectionId,
    });
    const deleteConnectionResult = await Connection.build(DeleteItemCommand)
      .key({
        id: connectionId as string,
        connectionId: connectionId as string,
      })
      .send();
    console.log(
      "Connection delete result:",
      JSON.stringify(deleteConnectionResult, null, 2)
    );

    // Delete the user connection record if we found a userId
    if (Item?.userId) {
      console.log("Deleting user connection with keys:", {
        id: Item.userId,
        userId: Item.userId,
      });
      const deleteUserConnectionResult = await UserConnection.build(
        DeleteItemCommand
      )
        .key({ id: Item.userId, userId: Item.userId })
        .send();
      console.log(
        "UserConnection delete result:",
        JSON.stringify(deleteUserConnectionResult, null, 2)
      );
    } else {
      console.log(
        "No userId found in connection item, skipping user connection deletion"
      );
    }

    console.log("Successfully disconnected:", connectionId);
    return { statusCode: 200 };
  } catch (error) {
    console.error("Error in ondisconnect:", error);
    return { statusCode: 500 };
  }
};

const onmessage = async (event: {
  requestContext: { connectionId: string; domainName: string; stage: string };
  body: string;
}) => {
  console.log("onmessage", JSON.stringify(event, null, 2));
  const connectionId = event.requestContext.connectionId;
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const message = JSON.parse(event.body);

  // Skip API Gateway call for local testing
  // if (isLocal) {
  //   console.log("Local testing - skipping API Gateway call");
  //   return {
  //     statusCode: 200,
  //     body: JSON.stringify({
  //       message: `Message received locally: ${JSON.stringify(message)}`,
  //     }),
  //   };
  // }

  // Use environment-aware API Gateway endpoint
  const apiGwClient = new ApiGatewayManagementApiClient({
    endpoint: isLocal ? `http://127.0.0.1:3001` : `https://${domain}/${stage}`,
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
    body: JSON.stringify({
      message: `Message received: ${JSON.stringify(message)}`,
    }),
  };
};

const ondefault = async (event: {
  requestContext: { connectionId: string };
}) => {
  const connectionId = event.requestContext.connectionId;
  console.log("default", JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Default route",
      connectionId: connectionId,
    }),
  };
};

export { onconnect, ondisconnect, onmessage, ondefault };
