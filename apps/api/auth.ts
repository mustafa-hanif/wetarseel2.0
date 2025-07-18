import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { Resend } from "resend";
import { createAuthClient } from "better-auth/client";
import { customSession } from "better-auth/plugins";
import { adminClient } from "better-auth/client/plugins";
import { admin } from "better-auth/plugins";
import { EmailTemplate } from "./templates/emailTemplate";
import { getAccountFromUser } from "queries/getAccountFromUser";
import { cache } from "index";
import { pool } from "pool";

const resend = new Resend(`re_2soPDivu_HVen2oemd51PwNbnx7Xaa7ui`);

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      const { data, error } = await resend.emails.send({
        from: "Wetarseel.ai <info@wetarseel.ai>",
        to: [user.email],
        subject: "Please reset your password",
        react: EmailTemplate({
          firstName: user.name,
          resetLink: url,
        }) as React.ReactElement,
      });
    },
  },
  plugins: [
    admin(),
    customSession(async ({ user, session }) => {
      let accountId = "";
      if (cache.has(user.email)) {
        accountId = cache.get(user.email) as string;
      } else {
        const account = await getAccountFromUser(user.email);
        cache.set(user.email, account?.id);
      }

      return {
        user: {
          ...user,
          accountId,
        },
        session,
      };
    }),
  ],
  trustedOrigins: [process.env.FRONTEND_URL ?? "https://uae.wetarseel.ai"],
  database: pool,
  user: {
    additionalFields: {
      accountId: {
        type: "string",
        required: false,
      },
    },
  },
});

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [adminClient()],
});
