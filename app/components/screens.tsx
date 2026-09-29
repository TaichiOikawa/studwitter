"use client";

import {
  CircleQuestionMarkIcon,
  ImagePlusIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  IMAGE_LIMIT,
  SUBJECTS,
  readImage,
  type CardChanges,
  type StudyCardData,
} from "../lib/study-feed";
import { AccountMenu, type UserProfile } from "./account-menu";
import { Avatar } from "./avatar";
import { StudyCard } from "./study-card";

const iconButton =
  "flex cursor-pointer rounded-full border-0 bg-transparent p-1.5 text-muted active:bg-surface-muted dark:text-muted-dark dark:active:bg-surface-dark";
const closeButton =
  "flex cursor-pointer border-0 bg-transparent p-1 text-ink dark:text-ink-dark";
const stickyHeader =
  "sticky top-[env(safe-area-inset-top,0px)] z-10 flex items-center justify-between border-b border-ink-dark bg-white dark:border-line-dark dark:bg-black";

type FeedItem = { instanceId: string; card: StudyCardData };

type FeedScreenProps = {
  email: string;
  isAdmin: boolean;
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  items: FeedItem[];
  isEmpty: boolean;
  onHelp: () => void;
  onClear: () => void;
  onCardChange: (id: string, changes: CardChanges) => void;
  onCardDelete: (id: string) => void;
  onNotice: (message: string) => void;
};

export function FeedScreen({
  email,
  isAdmin,
  profile,
  onProfileChange,
  items,
  isEmpty,
  onHelp,
  onClear,
  onCardChange,
  onCardDelete,
  onNotice,
}: FeedScreenProps) {
  return (
    <section>
      <header
        className={`${stickyHeader} bg-white/82 px-4.5 py-3.5 backdrop-blur-[10px] dark:bg-black/82`}
      >
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2.25 border-0 bg-transparent p-0 text-[16.5px] font-extrabold tracking-[0.2px] text-inherit"
          title="再読み込み"
          aria-label="Studwitterを再読み込み"
          onClick={() => window.location.reload()}
        >
          <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-ink text-ui font-extrabold text-white dark:bg-ink-dark dark:text-black">
            勉
          </span>
          Studwitter
        </button>
        <div className="flex gap-0.5">
          <button
            className={iconButton}
            title="使い方"
            aria-label="使い方"
            onClick={onHelp}
          >
            <CircleQuestionMarkIcon size={20} />
          </button>
          <button
            className={iconButton}
            title="全削除"
            aria-label="全削除"
            onClick={onClear}
          >
            <TrashIcon size={20} />
          </button>
          <AccountMenu
            email={email}
            isAdmin={isAdmin}
            profile={profile}
            onProfileChange={onProfileChange}
          />
        </div>
      </header>

      <div className="mx-auto max-w-panel pb-19" aria-label="feed">
        {items.map(({ instanceId, card }) => (
          <StudyCard
            key={instanceId}
            card={card}
            profile={profile}
            onChange={onCardChange}
            onDelete={onCardDelete}
            onNotice={onNotice}
          />
        ))}
      </div>

      {isEmpty && (
        <div className="px-6 py-17.5 text-center text-sm leading-[1.7] text-muted dark:text-muted-dark">
          まだカードがありません。
          <br />
          下の追加ボタンから知識を投稿しましょう。
        </div>
      )}
    </section>
  );
}

function SubpageHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className={`${stickyHeader} px-3.5 py-3`}>
      <button className={closeButton} aria-label="閉じる" onClick={onClose}>
        <XIcon name="close" size={22} />
      </button>
      <span className="text-ui font-bold">{title}</span>
      <span className="w-5.5" />
    </div>
  );
}

type ComposeScreenProps = {
  onClose: () => void;
  onSubmit: (text: string, image: string | null) => void;
  onNotice: (message: string) => void;
};

export function ComposeScreen({
  onClose,
  onSubmit,
  onNotice,
}: ComposeScreenProps) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    textArea.current?.focus();
  }, []);

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > IMAGE_LIMIT) {
      onNotice("画像サイズが大きすぎます(800KB以下推奨)");
      event.target.value = "";
      return;
    }

    try {
      setImage(await readImage(file));
    } catch {
      onNotice("画像を読み込めませんでした");
    }
  };

  return (
    <section>
      <div className={`${stickyHeader} px-3.5 py-3`}>
        <button className={closeButton} aria-label="閉じる" onClick={onClose}>
          <XIcon size={22} />
        </button>
        <button
          className="cursor-pointer rounded-popover border-0 bg-ink px-4.5 py-2 text-ui-compact font-bold text-white dark:bg-ink-dark dark:text-black"
          onClick={() => onSubmit(text, image)}
        >
          投稿
        </button>
      </div>

      <div className="mx-auto max-w-panel p-4.5">
        <div className="flex gap-3">
          <Avatar card={{ id: "compose-self", auto: false }} small />
          <textarea
            ref={textArea}
            className="min-h-[32vh] flex-1 resize-y border-0 bg-transparent text-lg leading-[1.6] text-ink outline-none placeholder:text-muted dark:text-ink-dark dark:placeholder:text-muted-dark"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="学びたい知識を入力…"
          />
        </div>

        {image && (
          <div className="relative mt-3 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="block max-h-55 max-w-full rounded-control"
              src={image}
              alt="添付画像のプレビュー"
            />
            <button
              className="absolute top-1.5 right-1.5 flex size-6.5 cursor-pointer items-center justify-center rounded-full border-0 bg-black/65 text-white"
              aria-label="画像を削除"
              onClick={() => setImage(null)}
            >
              <XIcon size={22} />
            </button>
          </div>
        )}

        <div className="mt-3 flex gap-4 border-t border-ink-dark pt-3 dark:border-line-dark">
          <button
            className="cursor-pointer border-0 bg-transparent text-ink dark:text-ink-dark"
            title="画像を追加"
            aria-label="画像を追加"
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlusIcon size={20} />
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={chooseImage}
        />
      </div>

    </section>
  );
}

export function AutoAddScreen({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (subjects: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <section>
      <SubpageHeader title="自動追加" onClose={onClose} />
      <div className="mx-auto max-w-panel px-4.5 py-5">
        <p className="text-caption leading-[1.7] text-muted dark:text-muted-dark">
          大学入試向けの教科を選ぶと、アプリに内蔵したオリジナルのサンプル知識カードを追加します。外部サイトから取得するものではありません(完全オフライン・著作権保護のため)。
        </p>
        <div className="my-4 flex flex-wrap gap-2.25">
          {SUBJECTS.map((subject) => {
            const isSelected = selected.includes(subject);
            return (
              <button
                key={subject}
                className={`cursor-pointer rounded-[20px] border px-4.5 py-2.25 text-sm font-semibold ${isSelected ? "border-ink bg-ink text-white dark:border-ink-dark dark:bg-ink-dark dark:text-black" : "border-ink-dark bg-surface-muted text-ink dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark"}`}
                aria-pressed={isSelected}
                onClick={() =>
                  setSelected((current) =>
                    isSelected
                      ? current.filter((item) => item !== subject)
                      : [...current, subject],
                  )
                }
              >
                {subject}
              </button>
            );
          })}
        </div>
        <button
          className="mt-1.5 w-full cursor-pointer rounded-popover border-0 bg-ink px-5 py-3.25 text-ui font-bold text-white dark:bg-ink-dark dark:text-black"
          onClick={() => onSubmit(selected)}
        >
          選択した教科を追加する
        </button>
      </div>
    </section>
  );
}

export function HelpScreen({ onClose }: { onClose: () => void }) {
  return (
    <section>
      <SubpageHeader title="使い方" onClose={onClose} />
      <div className="mx-auto max-w-panel px-4.5 py-5 text-ui-compact leading-[1.9] [&_b]:text-ink [&_p]:mb-3.5 [&_p]:text-muted dark:[&_b]:text-ink-dark dark:[&_p]:text-muted-dark">
        <p>
          <b>ホーム</b>
          <br />
          登録した知識カードがランダムに流れます。いいねが多いカードほど再度表示されやすくなります。
        </p>
        <p>
          <b>追加</b>
          <br />
          知識を入力して投稿できます。画像も添付できます。
        </p>
        <p>
          <b>いいね / 減らす</b>
          <br />
          ハートでいいねを加算、隣の「－」で1つ減らせます。
        </p>
        <p>
          <b>注釈</b>
          <br />
          各カードに自分用のメモを書いて保存できます(吹き出しアイコン)。
        </p>
        <p>
          <b>投稿メニュー(⋯)</b>
          <br />
          画像の追加/変更/削除、投稿の削除ができます。
        </p>
        <p>
          <b>自動追加</b>
          <br />
          教科を選ぶと、サンプル知識カードを追加します。
        </p>
        <p>
          <b>全削除</b>
          <br />
          登録した全カードを削除し、初期状態に戻します。確認画面が出てから実行されます。
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-x-5 px-5 py-4 text-micro text-secondary dark:border-line-dark dark:text-muted-dark">
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
      </div>
    </section>
  );
}
