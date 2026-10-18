"use client";

import { ImagePlusIcon, XIcon } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import {
  IMAGE_LIMIT,
  normalizeMaskedRanges,
  readImage,
  type StudyCardData,
} from "../lib/study-feed";
import { protectHashtags } from "../lib/hashtags";
import { Avatar } from "./avatar";
import { MaskedTextEditor } from "./masked-text-editor";

type PostValue = Pick<StudyCardData, "text" | "image" | "maskedRanges">;

type PostEditorProps = {
  id?: string;
  initialValue?: PostValue;
  showAvatar?: boolean;
  onSubmit: (value: PostValue) => void;
  onCancel?: () => void;
  onNotice: (message: string) => void;
};

export function PostEditor({
  id,
  initialValue,
  showAvatar,
  onSubmit,
  onCancel,
  onNotice,
}: PostEditorProps) {
  const [draft, setDraft] = useState<PostValue>(
    () => initialValue ?? { text: "", image: null, maskedRanges: [] },
  );
  const [toolbar, setToolbar] = useState<HTMLDivElement | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > IMAGE_LIMIT) {
      onNotice("画像サイズが大きすぎます(800KB以下推奨)");
      return;
    }
    try {
      const image = await readImage(file);
      setDraft((current) => ({ ...current, image }));
    } catch {
      onNotice("画像を読み込めませんでした");
    }
  };

  return (
    <form
      id={id}
      onSubmit={(event) => {
        event.preventDefault();
        const text = draft.text.trim();
        if (!text) {
          onNotice("投稿内容を入力してください");
          return;
        }
        const offset = draft.text.length - draft.text.trimStart().length;
        onSubmit({
          ...draft,
          text,
          maskedRanges: protectHashtags(text, normalizeMaskedRanges(
            draft.maskedRanges.map(({ start, end }) => ({
              start: start - offset,
              end: end - offset,
            })),
            text.length,
          )),
        });
      }}
    >
      <div className="flex gap-3">
        {showAvatar && <Avatar card={{ id: "compose-self", auto: false }} small />}
        <MaskedTextEditor
          initialText={initialValue?.text}
          initialRanges={initialValue?.maskedRanges}
          toolbar={toolbar}
          onChange={(text, maskedRanges) =>
            setDraft((current) => ({ ...current, text, maskedRanges }))
          }
        />
      </div>
      <p className="mt-2 text-caption text-muted dark:text-muted-dark">タグ（例：#英語）は目隠しできません。</p>
      {draft.image && (
        <div className="relative mt-3 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="block max-h-55 max-w-full rounded-control"
            src={draft.image}
            alt="添付画像のプレビュー"
          />
          <button
            type="button"
            className="absolute top-1.5 right-1.5 flex size-6.5 cursor-pointer items-center justify-center rounded-full border-0 bg-black/65 text-white"
            aria-label="画像を削除"
            onClick={() => setDraft((current) => ({ ...current, image: null }))}
          >
            <XIcon size={22} />
          </button>
        </div>
      )}
      <div
        ref={setToolbar}
        className="mt-3 flex gap-4 border-t border-ink-dark pt-3 dark:border-line-dark"
      >
        <button
          type="button"
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
      {onCancel && (
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-2xl border border-ink-dark bg-transparent px-3.75 py-1.5 text-meta font-bold dark:border-line-dark"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-2xl border-0 bg-ink px-3.75 py-1.5 text-meta font-bold text-white dark:bg-ink-dark dark:text-black"
          >
            保存
          </button>
        </div>
      )}
    </form>
  );
}
