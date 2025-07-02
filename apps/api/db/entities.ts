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
import { account, conversation, message } from "./mySchema";

const dynamoDBClient = new DynamoDBClient({
  // region: "me-central-1", // Replace with your region
  region: "localhost",
  endpoint: "http://localhost:8000", // Default port for DynamoDB Local
  credentials: {
    accessKeyId: "ggevny", // Can be anything for local
    secretAccessKey: "r2q3sh", // Can be anything for local
  },
});

export const WeTable = new Table({
  // 👇 DynamoDB config.
  name: "WeTable",
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
