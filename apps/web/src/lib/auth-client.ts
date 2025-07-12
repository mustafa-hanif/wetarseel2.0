import { createAuthClient } from "better-auth/solid";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:4000",
});

export const { signIn, signUp, useSession } = authClient;
