import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table } from "dynamodb-toolbox/table";
import { Entity } from "dynamodb-toolbox/entity";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { prefix } from "dynamodb-toolbox/transformers/prefix";

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

export const userConnection = item({
  phoneNumberId: string().key().transform(prefix("PHONE")).savedAs("pk"),
  userId: string().key().transform(prefix("USER")).savedAs("sk"),
  connectionId: string(), // Remove prefix for sk\
  domain: string(),
  stage: string(),
});

export const WeTable = new Table({
  name: process.env.DYNAMODB_TABLE_NAME || "WeTable",
  partitionKey: { name: "pk", type: "string" },
  sortKey: { name: "sk", type: "string" },
  documentClient: DynamoDBDocumentClient.from(dynamoDBClient),
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
    phoneNumberId: string;
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
    const phoneNumberId = event.queryStringParameters?.phoneNumberId || "";
    const userId = event.queryStringParameters?.userId || "";

    console.log(
      "Connecting phone number:",
      phoneNumberId,
      "with connectionId:",
      connectionId
    );
    console.log("Table name:", process.env.DYNAMODB_TABLE_NAME);

    const userConnectionItem = {
      phoneNumberId,
      userId,
      connectionId,
      domain,
      stage,
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

    console.log("Successfully stored connection for user:", phoneNumberId);
    return { statusCode: 200 };
  } catch (error) {
    console.error("Error in onconnect:", error);
    return { statusCode: 500 };
  }
};

export { onconnect };
