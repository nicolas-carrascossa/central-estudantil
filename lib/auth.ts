import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";

import prisma from "./db";
import { env } from "./env";

const baseOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
const prodOrigin = env.BETTER_AUTH_URL
  ? new URL(env.BETTER_AUTH_URL).origin
  : null;
const trustedOrigins = prodOrigin
  ? [...baseOrigins, prodOrigin]
  : baseOrigins;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [admin(), nextCookies()
  ]
});

export default auth;

