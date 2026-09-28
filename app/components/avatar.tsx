import type { StudyCardData } from "../lib/study-feed";

const AVATAR_COLORS = [
  "var(--color-brand)",
  "var(--color-accent-pink)",
  "var(--color-avatar-orange)",
  "var(--color-avatar-green)",
  "var(--color-avatar-violet)",
  "var(--color-avatar-rose)",
  "var(--color-avatar-amber)",
  "var(--color-avatar-cyan)",
  "var(--color-avatar-fuchsia)",
  "var(--color-avatar-lime)",
  "var(--color-avatar-red)",
  "var(--color-avatar-teal)",
];

function hashId(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function AvatarGlyph({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <path
          d="M12 3.5l2 5 5.5.6-4.1 3.7 1.2 5.4-4.6-2.8-4.6 2.8 1.2-5.4-4.1-3.7 5.5-.6z"
          fill="white"
        />
      );
    case 1:
      return <path d="M13 2 5 14h6l-1 8 9-12h-6z" fill="white" />;
    case 2:
      return (
        <circle
          cx="12"
          cy="12"
          r="6"
          fill="none"
          stroke="white"
          strokeWidth="2.4"
        />
      );
    case 3:
      return <path d="M12 4l7.5 15h-15z" fill="white" />;
    case 4:
      return <path d="M12 3l6.5 9-6.5 9-6.5-9z" fill="white" />;
    case 5:
      return (
        <path
          d="M15.5 3a8.2 8.2 0 1 0 5 14.8A6.3 6.3 0 0 1 15.5 3z"
          fill="white"
        />
      );
    case 6:
      return (
        <path
          d="M4 12c2-4.5 4-4.5 6.5 0s4.5 4.5 7 0"
          stroke="white"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      );
    case 7:
      return (
        <rect
          x="6"
          y="6"
          width="12"
          height="12"
          rx="3"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
        />
      );
    default:
      return (
        <path
          d="M12 2l2.4 6.4L21 11l-6.6 2.6L12 20l-2.4-6.4L3 11l6.6-2.6z"
          fill="white"
        />
      );
  }
}

export function Avatar({
  card,
  small = false,
}: {
  card: Pick<StudyCardData, "id" | "auto">;
  small?: boolean;
}) {
  const hash = hashId(card.id);
  const glyph = card.auto ? 8 : hash % 8;
  const color = card.auto
    ? "var(--color-surface-dark)"
    : AVATAR_COLORS[Math.floor(hash / 7) % AVATAR_COLORS.length];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full ${small ? "size-10" : "size-11"} ${card.auto ? "ring-2 ring-ink ring-offset-2 ring-offset-white dark:ring-ink-dark dark:ring-offset-black" : ""}`}
      style={{ background: color }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={small ? 18 : 22} height={small ? 18 : 22}>
        <AvatarGlyph index={glyph} />
      </svg>
      {card.auto && (
        <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-ink dark:border-black dark:bg-ink-dark">
          <svg
            viewBox="0 0 24 24"
            width="9"
            height="9"
            fill="none"
            stroke="white"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:stroke-black"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      )}
    </div>
  );
}
