import { Table } from "dynamodb-toolbox/table";
// 👇 Peer dependencies
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";

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
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { Entity } from "dynamodb-toolbox/entity";
import { Account, Conversation, Message } from "./entities";

// const command = PokemonEntity.build(PutItemCommand)
//   // 👇 Validated AND type-safe!
//   .item({
//     pokemonId: "pikachu-1",
//     species: "pikachu",
//     level: 42,
//     isLegendary: false,
//   });

async function doSomething() {
  const addAccount = Account.build(PutItemCommand).item({
    id: "account-1",
    accountId: "account-1",
  });
  await addAccount.send();

  const addConvo = Conversation.build(PutItemCommand).item({
    id: "convo-1",
    accountId: "account-1",
  });
  await addConvo.send();

  const addMessage = Message.build(PutItemCommand).item({
    id: "message-2",
    conversationId: "convo-1",
    time: new Date().toISOString(),
    accountId: "account-1",
    content: "nice!",
  });
  await addMessage.send();
}
export default doSomething;
