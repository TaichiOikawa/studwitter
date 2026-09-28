import { auth } from "@/app/lib/auth";
import { LoginForm } from "@/app/login/login-form";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : null;

  return <LoginForm errorCode={errorCode} />;
}
