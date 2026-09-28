import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studwitter",
  description: "某有名SNSが、暗記カードになる。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white font-sans tracking-body text-ink dark:bg-black dark:text-ink-dark">
        {children}
      </body>
    </html>
  );
}
