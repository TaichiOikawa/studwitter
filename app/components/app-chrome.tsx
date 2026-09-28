import { HomeIcon, PlusIcon, RefreshCcwIcon } from "lucide-react";
import type { Screen } from "../lib/study-feed";

export type ModalState = {
  type: "confirm" | "notice";
  message: string;
};

export function BottomNav({
  screen,
  onNavigate,
}: {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  const itemClass = (active: boolean) =>
    `cursor-pointer rounded-xl border-0 bg-transparent px-[26px] py-1.5 ${active ? "text-ink dark:text-ink-dark" : "text-muted dark:text-muted-dark"}`;

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-20 flex justify-around border-t border-ink-dark bg-white/88 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] backdrop-blur-[10px] dark:border-line-dark dark:bg-black/88"
      aria-label="メインナビゲーション"
    >
      <button
        className={itemClass(screen === "feed")}
        title="ホーム"
        aria-label="ホーム"
        onClick={() => onNavigate("feed")}
      >
        <HomeIcon size={20} />
      </button>
      <button
        className={itemClass(screen === "compose")}
        title="追加"
        aria-label="追加"
        onClick={() => onNavigate("compose")}
      >
        <PlusIcon size={20} />
      </button>
      <button
        className={itemClass(screen === "auto")}
        title="自動追加"
        aria-label="自動追加"
        onClick={() => onNavigate("auto")}
      >
        <RefreshCcwIcon size={20} />
      </button>
    </nav>
  );
}

export function AppModal({
  modal,
  onClose,
}: {
  modal: ModalState;
  onClose: (result: boolean) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6"
      role="dialog"
      aria-modal="true"
      aria-label="確認"
    >
      <div className="w-full max-w-80 rounded-2xl bg-white p-5.5 text-ink shadow-popover dark:bg-black dark:text-ink-dark">
        <p className="mb-5 text-ui-compact leading-[1.6]">{modal.message}</p>
        <div className="flex justify-end gap-2.5">
          {modal.type === "confirm" && (
            <button
              className="cursor-pointer rounded-card border border-ink-dark bg-surface-muted px-4.5 py-2.25 text-sm font-semibold dark:border-line-dark dark:bg-surface-dark"
              onClick={() => onClose(false)}
            >
              キャンセル
            </button>
          )}
          <button
            className="cursor-pointer rounded-card border-0 bg-danger px-4.5 py-2.25 text-sm font-semibold text-white"
            onClick={() => onClose(true)}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
