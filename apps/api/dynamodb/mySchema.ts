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
import { prefix } from "dynamodb-toolbox/transformers/prefix";

// ...or direct/deep imports
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";

export const conversation = item({
  id: string().key().transform(prefix("CONVERSATION")).savedAs("sk"),
  accountId: string().key().transform(prefix("ACCOUNT")).savedAs("pk"),
});

export const account = item({
  id: string().key().transform(prefix("ACCOUNT")).savedAs("pk"),
  accountId: string().key().transform(prefix("ACCOUNT")).savedAs("sk"),
});

export const message = item({
  id: string().key(),
  conversationId: string().key(),
  time: string().key(),
  accountId: string().key(),
  content: string(),
});
