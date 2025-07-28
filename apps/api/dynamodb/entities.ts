import { Table } from "dynamodb-toolbox/table";
// 👇 Peer dependencies
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { prefix } from "dynamodb-toolbox/transformers/prefix";
import { pipe } from "dynamodb-toolbox/transformers/pipe";

import {
  schema,
  s,
  number,
  boolean,
  set,
  list,
  record,
  anyOf,
  map,
} from "dynamodb-toolbox/schema";
// ...or direct/deep imports
import { Entity } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { account, conversation, message, conversationMeta } from "./mySchema";

// export const dynamoDBClient = new DynamoDBClient(
//   process.env.NODE_ENV === "development"
//     ? {
//         region: "localhost",
//         endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
//         credentials: {
//           accessKeyId: "ggevny", // Can be anything for local
//           secretAccessKey: "r2q3sh", // Can be anything for local
//         },
//       }
//     : {
//         region: process.env.AWS_REGION || "me-central-1",
//       }
// );

export const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "me-central-1",
});

export const WeTable = new Table({
  // 👇 DynamoDB config.
  name: "wetarseel-dev-wetable",
  partitionKey: { name: "pk", type: "string" },
  sortKey: { name: "sk", type: "string" },
  // 👇 Inject the client
  documentClient: DynamoDBDocumentClient.from(dynamoDBClient),
});

export const Account = new Entity({
  name: "ACCOUNT",
  table: WeTable,
  schema: account,
});

export const Conversation = new Entity({
  name: "CONVERSATION",
  table: WeTable,
  schema: conversation,
});

export const Message = new Entity({
  name: "MESSAGE",
  table: WeTable,
  schema: message,
  computeKey: ({ id, conversationId, time, accountId }) => {
    const acPrefixer = prefix("ACCOUNT");
    const skPrefixer = prefix("MSG");
    return {
      pk: acPrefixer.encode(accountId),
      sk: skPrefixer.encode([conversationId, time, id].join("#")),
    };
  },
});

export const userConnection = item({
  phoneNumberId: string().key().transform(prefix("PHONE")).savedAs("pk"),
  userId: string().key().transform(prefix("USER")).savedAs("sk"),
  connectionId: string(), // Remove prefix for sk\
  domain: string(),
  stage: string(),
});

export const UserConnection = new Entity({
  name: "USER_CONNECTION",
  table: WeTable,
  schema: userConnection,
});

export const ConversationMeta = new Entity({
  name: "CONVERSATION_META",
  table: WeTable,
  schema: conversationMeta,
});
