import { db, type s, pool } from "../db";
const getAccountFromUser = async (email: string) => {
  const oneUser = await db.selectExactlyOne("users", { email }).run(pool);

  const account = await db
    .selectExactlyOne(
      "accounts",
      db.sql`${"pb_user_id"}::jsonb ? ${db.param(oneUser.id)}`
    )
    .run(pool);
  return account;
};

export { getAccountFromUser };
