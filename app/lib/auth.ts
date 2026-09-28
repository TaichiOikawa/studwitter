import { getPrisma } from "@/app/lib/prisma";
import { getRuntimeEnv } from "@/app/lib/runtime-env";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAdminEmail() {
  const email = getRuntimeEnv("ADMIN_EMAIL");
  return email ? normalizeEmail(email) : null;
}

export function isAdminEmail(email: string) {
  const adminEmail = getAdminEmail();
  return Boolean(adminEmail && normalizeEmail(email) === adminEmail);
}

const prisma = getPrisma();

export const auth = betterAuth({
  appName: "Studwitter",
  baseURL: getRuntimeEnv("BETTER_AUTH_URL"),
  secret: getRuntimeEnv("BETTER_AUTH_SECRET"),
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  socialProviders: {
    google: {
      clientId: getRuntimeEnv("GOOGLE_CLIENT_ID") ?? "",
      clientSecret: getRuntimeEnv("GOOGLE_CLIENT_SECRET") ?? "",
      prompt: "select_account",
      requireEmailVerification: true,
    },
  },
  user: {
    validateUserInfo: async ({ user, source }) => {
      if (source.method !== "oauth" || source.oauth?.providerId !== "google") {
        return {
          error: "provider_not_allowed",
          errorDescription: "Googleアカウントでログインしてください。",
        };
      }

      if (!user.email) {
        return {
          error: "email_not_found",
          errorDescription: "Googleアカウントのメールアドレスを取得できません。",
        };
      }

      return;
    },
  },
});
