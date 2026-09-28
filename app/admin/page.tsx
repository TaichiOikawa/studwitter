import { auth, isAdminEmail } from "@/app/lib/auth";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (!isAdminEmail(session.user.email)) notFound();

  return (
    <main className="min-h-screen bg-surface-panel px-5 py-10 text-ink dark:bg-black dark:text-ink-dark">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand">
              管理者 · {session.user.email}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">
              管理ページ
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-bold dark:border-white/20"
          >
            アプリへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
