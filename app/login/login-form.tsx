"use client";

import { authClient } from "@/app/lib/auth-client";
import Link from "next/link";
import { useState } from "react";

type LoginFormProps = {
  errorCode: string | null;
};

const errorMessages: Record<string, string> = {
  email_not_found: "Googleアカウントのメールアドレスを取得できませんでした。",
  provider_not_allowed: "Googleアカウントでログインしてください。",
};

export function LoginForm({ errorCode }: LoginFormProps) {
  const [pending, setPending] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const initialError = errorCode
    ? (errorMessages[errorCode] ??
      "ログインできませんでした。もう一度お試しください。")
    : null;

  const signIn = async () => {
    setPending(true);
    setClientError(null);

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/login",
    });

    if (error) {
      setClientError(error.message ?? "Googleログインを開始できませんでした。");
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-svh flex-col bg-white text-ink dark:bg-black dark:text-ink-dark">
      <div className="mx-auto grid w-full max-w-page flex-1 grid-cols-1 lg:grid-cols-[minmax(420px,0.86fr)_minmax(520px,1.14fr)]">
        <section className="order-2 mx-auto flex w-full px-7 sm:px-12 lg:order-1 lg:items-center lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-form">
            <div className="mb-10 lg:mb-12">
              <p className="text-[min(11vw,3.25rem)] font-black leading-[0.94] tracking-[-0.065em] lg:text-[clamp(3.25rem,4.5vw,4rem)]">
                <span className="block whitespace-nowrap">
                  すべての学びが、
                </span>
                <span className="block whitespace-nowrap">ここに。</span>
              </p>
              <p className="mt-5 text-ui font-medium leading-6 text-secondary dark:text-muted-dark">
                某有名SNSが、暗記カードになる。
              </p>
            </div>

            <div className="space-y-4">
              {clientError || initialError ? (
                <p
                  role="alert"
                  className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                >
                  {clientError ?? initialError}
                </p>
              ) : null}

              <button
                type="button"
                onClick={signIn}
                disabled={pending}
                className="group flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-6 text-ui font-bold text-ink shadow-auth-control transition hover:bg-surface-subtle hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 dark:border-line-dark dark:bg-black dark:text-ink-dark dark:shadow-none dark:hover:bg-surface-dark"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5 shrink-0"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.2c0-.69-.06-1.2-.19-1.73H12v3.35h5.38a4.73 4.73 0 0 1-2 3.03l-.02.11 2.9 2.25.2.02c1.84-1.7 2.9-4.2 2.9-7.03Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.75c2.63 0 4.84-.86 6.45-2.52l-3.08-2.38c-.82.56-1.92.95-3.37.95a5.85 5.85 0 0 1-5.53-4.04l-.1.01-3.02 2.34-.04.1A9.74 9.74 0 0 0 12 21.75Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.47 13.76A5.97 5.97 0 0 1 6.14 12c0-.61.12-1.2.31-1.76v-.12L3.4 7.75l-.1.05A9.73 9.73 0 0 0 2.25 12c0 1.51.38 2.94 1.06 4.2l3.16-2.44Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.2c1.83 0 3.07.79 3.78 1.44l2.73-2.67A9.12 9.12 0 0 0 12 2.25 9.74 9.74 0 0 0 3.31 7.8l3.14 2.44A5.87 5.87 0 0 1 12 6.2Z"
                  />
                </svg>
                {pending ? "Google へ移動中…" : "Google で続ける"}
              </button>

              <p className="px-1 text-xs leading-[1.55] text-secondary dark:text-muted-dark">
                続行することで、
                <Link className="underline hover:text-brand" href="/terms">
                  利用規約
                </Link>
                、
                <Link className="underline hover:text-brand" href="/privacy">
                  プライバシーポリシー
                </Link>
                、Cookie の使用に同意したものとみなされます。
              </p>
            </div>
          </div>
        </section>

        <section
          aria-label="Studwitter"
          className="order-1 flex items-center justify-center overflow-hidden lg:order-2 lg:min-h-full"
        >
          <div className="relative flex w-[min(64vw,560px)] items-center justify-center lg:w-[min(39vw,590px)]">
            <span className="flex size-42 lg:size-62 shrink-0 items-center justify-center rounded-4xl bg-ink text-8xl lg:text-9xl font-extrabold text-white dark:bg-ink-dark dark:text-black">
              勉
            </span>
          </div>
        </section>
      </div>

      <footer className="flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-line-subtle px-5 py-4 text-micro text-secondary dark:border-line-dark dark:text-muted-dark">
        <a
          href="https://forms.gle/gXqns2fxKdTs9vyg6"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-ink hover:underline dark:hover:text-ink-dark"
        >
          お問い合わせ
        </a>
        <Link
          className="hover:text-ink hover:underline dark:hover:text-ink-dark"
          href="/terms"
        >
          利用規約
        </Link>
        <Link
          className="hover:text-ink hover:underline dark:hover:text-ink-dark"
          href="/privacy"
        >
          プライバシーポリシー
        </Link>
        <span>© 2026 Studwitter</span>
      </footer>
    </main>
  );
}

export default LoginForm;
