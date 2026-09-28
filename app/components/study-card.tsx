"use client";

import {
  EllipsisIcon,
  HeartIcon,
  MessageSquareIcon,
  MinusIcon,
  Repeat2Icon,
  ShareIcon,
} from "lucide-react";
import { MouseEvent, useEffect, useRef, useState } from "react";
import {
  IMAGE_LIMIT,
  readImage,
  relativeTime,
  type CardChanges,
  type StudyCardData,
} from "../lib/study-feed";
import type { UserProfile } from "./account-menu";
import { Avatar } from "./avatar";

const actionButton =
  "flex cursor-pointer items-center gap-[5px] border-0 bg-transparent p-0.5 text-inherit";

type StudyCardProps = {
  card: StudyCardData;
  profile: UserProfile;
  onChange: (id: string, changes: CardChanges) => void;
  onDelete: (id: string) => void;
  onNotice: (message: string) => void;
};

export function StudyCard({
  card,
  profile,
  onChange,
  onDelete,
  onNotice,
}: StudyCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(card.note);
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = () => setMenuOpen(false);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [menuOpen]);

  const toggleMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuOpen((current) => !current);
  };

  const toggleNote = () => {
    setNoteDraft(card.note);
    setNoteOpen((current) => !current);
  };

  const updateImage = async (file: File) => {
    setMenuOpen(false);
    if (file.size > IMAGE_LIMIT) {
      onNotice("画像サイズが大きすぎます(800KB以下推奨)");
      return;
    }

    try {
      onChange(card.id, { image: await readImage(file) });
    } catch {
      onNotice("画像を読み込めませんでした");
    }
  };

  const deleteImage = () => {
    setMenuOpen(false);
    if (!card.image) {
      onNotice("画像はありません");
      return;
    }
    onChange(card.id, { image: null });
  };

  return (
    <article className="relative flex gap-3.5 border-b border-ink-dark px-4.5 pt-5.5 pb-6 max-[420px]:gap-2.75 max-[420px]:px-3.5 dark:border-line-dark">
      <Avatar card={card} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.25 overflow-visible text-ui whitespace-nowrap max-[420px]:gap-1">
          <span className="overflow-hidden font-bold text-ellipsis">
            {card.auto ? "自動追加" : profile.name}
          </span>
          <span className="overflow-hidden text-caption font-normal text-ellipsis text-muted dark:text-muted-dark">
            @{profile.username}
          </span>
          <span className="text-caption font-normal text-muted dark:text-muted-dark">
            ・
          </span>
          <span className="text-caption font-normal text-muted dark:text-muted-dark">
            {relativeTime(card.createdAt)}
          </span>
          <button
            className="ml-auto flex cursor-pointer rounded-full border-0 bg-transparent p-1 text-muted dark:text-muted-dark"
            aria-label="投稿メニュー"
            onClick={toggleMenu}
          >
            <EllipsisIcon size={20} />
          </button>
        </div>

        <div className="mt-0.75 text-ui leading-normal whitespace-pre-wrap wrap-break-word">
          {card.text}
        </div>

        {card.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="mt-2.25 block max-h-70 max-w-full rounded-control border border-ink-dark object-cover dark:border-line-dark"
            src={card.image}
            alt="知識カードに添付された画像"
          />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-5 text-muted max-[420px]:justify-between max-[420px]:gap-2.5 dark:text-muted-dark">
          <button
            className={actionButton}
            title="注釈"
            aria-label="注釈"
            onClick={toggleNote}
          >
            <MessageSquareIcon size={18} />
          </button>
          <button className={actionButton} title="復習" aria-label="復習">
            <Repeat2Icon size={18} />
          </button>
          <button
            className={`${actionButton} ${card.likes > 0 ? "text-accent-pink [&_svg]:fill-accent-pink [&_svg]:stroke-accent-pink" : ""}`}
            aria-label="いいね"
            onClick={() => onChange(card.id, { likes: card.likes + 1 })}
          >
            <HeartIcon size={18} />
            <span className="text-[13px]">{card.likes}</span>
          </button>
          <button
            className={`${actionButton} rounded-lg border border-ink-dark px-1.5 py-0.5 dark:border-line-dark`}
            title="いいねを減らす"
            aria-label="いいねを減らす"
            onClick={() =>
              onChange(card.id, { likes: Math.max(0, card.likes - 1) })
            }
          >
            <MinusIcon size={18} />
          </button>
          <button className={actionButton} title="共有" aria-label="共有">
            <ShareIcon size={18} />
          </button>
        </div>

        {card.note && (
          <div className="mt-2.25 rounded-[10px] border border-ink-dark bg-surface-card px-2.75 py-2.25 text-caption dark:border-line-dark dark:bg-surface-black">
            <span>{card.note}</span>
            <button
              className="ml-2 cursor-pointer border-0 bg-transparent p-0 text-xs text-muted underline dark:text-muted-dark"
              onClick={toggleNote}
            >
              編集
            </button>
          </div>
        )}

        {noteOpen && (
          <div className="mt-2.25 flex flex-col gap-1.5">
            <textarea
              className="min-h-12.5 w-full rounded-[10px] border border-ink-dark bg-white p-2.25 text-caption text-ink outline-none placeholder:text-muted dark:border-line-dark dark:bg-black dark:text-ink-dark dark:placeholder:text-muted-dark"
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="自分用の注釈・メモを入力…"
            />
            <button
              className="self-end rounded-2xl border-0 bg-ink px-3.75 py-1.5 text-meta font-bold text-white dark:bg-ink-dark dark:text-black"
              onClick={() => {
                onChange(card.id, { note: noteDraft.trim() });
                setNoteOpen(false);
              }}
            >
              保存
            </button>
          </div>
        )}

        {menuOpen && (
          <div
            className="absolute top-10 right-4.5 z-5 min-w-40 overflow-hidden rounded-xl border border-ink-dark bg-white shadow-card-menu dark:border-line-dark dark:bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="block w-full cursor-pointer border-0 border-b border-ink-dark bg-transparent px-4 py-2.75 text-left text-sm dark:border-line-dark"
              onClick={() => imageInput.current?.click()}
            >
              画像を追加/変更
            </button>
            <button
              className="block w-full cursor-pointer border-0 border-b border-ink-dark bg-transparent px-4 py-2.75 text-left text-sm dark:border-line-dark"
              onClick={deleteImage}
            >
              画像を削除
            </button>
            <button
              className="block w-full cursor-pointer border-0 bg-transparent px-4 py-2.75 text-left text-sm text-danger"
              onClick={() => onDelete(card.id)}
            >
              投稿を削除
            </button>
          </div>
        )}

        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) updateImage(file);
            event.target.value = "";
          }}
        />
      </div>
    </article>
  );
}
