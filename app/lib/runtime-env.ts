import { env } from "cloudflare:workers";

type RuntimeEnv = {
  ADMIN_EMAIL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

const workerEnv = env as unknown as RuntimeEnv;

export function getRuntimeEnv(name: keyof RuntimeEnv) {
  return workerEnv[name] ?? process.env[name];
}
