import { authClient, auth } from "./auth";
import { db, type s, pool } from "./db";
export const migrateUsers = async () => {
  try {
    console.log("Starting user migration...");
    const allUsers = await db.select("users", db.all).run(pool);
    allUsers.forEach(async (user) => {
      try {
        console.log(`Migrating user: ${user.name} (${user.email})`);
        const newUser = await auth.api.createUser({
          body: {
            name: user.name ?? "",
            email: user.email ?? "",
            password: "password123",
            role: "user", // this can also be an array for multiple roles (e.g. ["user", "sale"])
            data: {
              // any additional on the user table including plugin fields and custom fields
              avatar: user.avatar ?? "",
              verified: user.verified ?? false,
              phonenumber: user.phonenumber ?? "",
              name: user.name ?? "",
              notification: user.notification ?? false,
            },
          },
        });
        console.log("New user created:", newUser);
      } catch (error) {
        console.error(
          `Error migrating user ${user.name} (${user.email}):`,
          error
        );
      }
    });
  } catch (error) {
    console.error("Error during user migration:", error);
  }
};
