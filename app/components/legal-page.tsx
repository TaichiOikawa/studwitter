import Link from "next/link";
import type { ReactNode } from "react";

type LegalSection = {
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
}: LegalPageProps) {
  return (
    <main className="min-h-screen text-ink dark:text-ink-dark">
      <header className="sticky top-0 z-10 border-b border-line-subtle bg-white/90 backdrop-blur-xl dark:border-line-dark dark:bg-black/85">
        <div className="mx-auto flex h-16 w-full max-w-260 items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <span className="flex size-9 items-center justify-center rounded-[11px] bg-ink text-lg font-black text-white dark:bg-ink-dark dark:text-black">
              勉
            </span>
            <span className="text-base font-extrabold tracking-tight">
              Studwitter
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold transition-colors hover:border-brand hover:text-brand dark:border-line-strong-dark dark:bg-surface-dark"
          >
            サービスに戻る
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-260 gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-16 lg:py-20">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-ms font-extrabold tracking-[0.16em] uppercase">
            Legal
          </p>
          <nav aria-label="法的情報" className="flex gap-2 lg:flex-col">
            <Link
              href="/terms"
              aria-current={eyebrow === "利用規約" ? "page" : undefined}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                eyebrow === "利用規約"
                  ? "bg-ink text-white dark:bg-ink-dark dark:text-black"
                  : "text-secondary hover:bg-white hover:text-ink dark:text-muted-dark dark:hover:bg-surface-dark dark:hover:text-ink-dark"
              }`}
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              aria-current={
                eyebrow === "プライバシーポリシー" ? "page" : undefined
              }
              className={`rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                eyebrow === "プライバシーポリシー"
                  ? "bg-ink text-white dark:bg-ink-dark dark:text-black"
                  : "text-secondary hover:bg-white hover:text-ink dark:text-muted-dark dark:hover:bg-surface-dark dark:hover:text-ink-dark"
              }`}
            >
              プライバシー
            </Link>
          </nav>
        </aside>

        <article className="min-w-0">
          <div className="mb-10 border-b border-line pb-10 dark:border-line-dark sm:mb-12 sm:pb-12">
            <p className="mb-4 text-lg font-bold">{eyebrow}</p>
            <h1 className="text-[clamp(2.25rem,6vw,4rem)] font-black leading-[1.05] tracking-[-0.055em]">
              {title}
            </h1>
            <p className="mt-6 text-ui leading-7 text-secondary dark:text-muted-dark sm:text-base">
              {description}
            </p>
            <p className="mt-5 text-xs font-medium text-muted dark:text-muted-dark">
              最終更新日：{updatedAt}
            </p>
          </div>

          <div className="space-y-11 sm:space-y-14">
            {sections.map((section, index) => (
              <section
                key={section.title}
                aria-labelledby={`section-${index + 1}`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2
                    id={`section-${index + 1}`}
                    className="text-xl font-extrabold tracking-tight sm:text-2xl"
                  >
                    {section.title}
                  </h2>
                </div>
                <div className="legal-copy pl-0 text-ui leading-7 text-secondary dark:text-muted-dark sm:pl-9 sm:text-base">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16 flex flex-col gap-4 rounded-card border border-line bg-white p-6 dark:border-line-dark dark:bg-surface-deep sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-extrabold">Studwitter</p>
              <p className="mt-1 text-sm text-secondary dark:text-muted-dark">
                学びを、もっと日常の中へ。
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm font-bold text-brand hover:text-brand-strong hover:underline"
            >
              サービスに戻る →
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
