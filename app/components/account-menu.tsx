"use client";

import { authClient } from "@/app/lib/auth-client";
import {
  AtSignIcon,
  LogOutIcon,
  SaveIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type UserProfile = {
  name: string;
  username: string;
};

type AccountMenuProps = {
  email: string;
  isAdmin: boolean;
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
};

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : null;
  } catch {
    return null;
  }
}

export function AccountMenu({
  email,
  isAdmin,
  profile,
  onProfileChange,
}: AccountMenuProps) {
  const router = useRouter();
  const dialog = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const openDialog = () => {
    setName(profile.name);
    setUsername(profile.username);
    setError("");
    setOpen(true);
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username }),
      });

      if (!response.ok) {
        throw new Error(
          (await getErrorMessage(response)) ??
            "プロフィールを更新できませんでした。",
        );
      }

      const body = (await response.json()) as { profile: UserProfile };
      onProfileChange(body.profile);
      setOpen(false);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "プロフィールを更新できませんでした。",
      );
    } finally {
      setPending(false);
    }
  };

  const signOut = async () => {
    setPending(true);
    setError("");
    const result = await authClient.signOut();
    if (result.error) {
      setError("ログアウトできませんでした。もう一度お試しください。");
      setPending(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        className="flex cursor-pointer rounded-full border-0 bg-transparent p-1.5 text-muted active:bg-surface-muted dark:text-muted-dark dark:active:bg-surface-dark"
        title="アカウント管理"
        aria-label="アカウント管理"
        onClick={openDialog}
      >
        <UserRoundIcon size={20} />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div
              ref={dialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="account-dialog-title"
              className="w-full max-w-content rounded-2xl border border-ink-dark bg-white p-5 text-ink shadow-2xl dark:border-line-dark dark:bg-black dark:text-ink-dark"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="account-dialog-title" className="text-lg font-bold">
                    アカウント管理
                  </h2>
                  <p className="mt-1 max-w-72.5 truncate text-xs text-muted dark:text-muted-dark">
                    {email}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex cursor-pointer rounded-full border-0 bg-transparent p-1 text-muted hover:bg-surface-muted dark:text-muted-dark dark:hover:bg-surface-dark"
                  aria-label="閉じる"
                  onClick={() => setOpen(false)}
                >
                  <XIcon size={22} />
                </button>
              </div>

              <form className="mt-5 space-y-4" onSubmit={saveProfile}>
                <label className="block text-sm font-semibold">
                  表示名
                  <input
                    className="mt-1.5 w-full rounded-xl border border-line-strong bg-transparent px-3.5 py-2.5 text-ui outline-none focus:border-ink dark:border-line-strong-dark dark:focus:border-ink-dark"
                    value={name}
                    maxLength={40}
                    required
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>

                <label className="block text-sm font-semibold">
                  ユーザー名
                  <span className="mt-1.5 flex items-center rounded-xl border border-line-strong focus-within:border-ink dark:border-line-strong-dark dark:focus-within:border-ink-dark">
                    <AtSignIcon className="ml-3 text-muted" size={17} />
                    <input
                      className="min-w-0 flex-1 border-0 bg-transparent px-1.5 py-2.5 text-ui outline-none"
                      value={username}
                      minLength={3}
                      maxLength={20}
                      pattern="[a-zA-Z0-9_]+"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                  </span>
                  <span className="mt-1.5 block text-xs font-normal text-muted dark:text-muted-dark">
                    3〜20文字の半角英数字とアンダースコア
                  </span>
                </label>

                {error && (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:cursor-default disabled:opacity-50 dark:bg-ink-dark dark:text-black"
                >
                  <SaveIcon size={17} />
                  {pending ? "保存中…" : "変更を保存"}
                </button>
              </form>

              <div className="mt-5 border-t border-ink-dark pt-4 dark:border-line-dark">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="mb-2 block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-surface-muted dark:hover:bg-surface-dark"
                  >
                    管理ページを開く
                  </Link>
                )}
                <button
                  type="button"
                  disabled={pending}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-danger hover:bg-danger-soft disabled:opacity-50 dark:hover:bg-danger-soft-dark"
                  onClick={signOut}
                >
                  <LogOutIcon size={17} />
                  ログアウト
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
