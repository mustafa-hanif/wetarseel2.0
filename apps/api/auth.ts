import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { Resend } from "resend";
import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { admin } from "better-auth/plugins";
import { EmailTemplate } from "./templates/emailTemplate";

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
  plugins: [admin()],
  trustedOrigins: ["http://localhost:3000"],
  database: new Pool({
    connectionString: process.env.ZAPATOS_DB_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});

export const authClient = createAuthClient({
  baseURL: "http://localhost:4000",
  plugins: [adminClient()],
});
