"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createPostCards,
  createSampleCards,
  loadCards,
  pickWeighted,
  saveCards,
  type CardChanges,
  type Screen,
  type StudyCardData,
  type TextRange,
} from "../lib/study-feed";
import type { UserProfile } from "./account-menu";
import { AppModal, BottomNav, type ModalState } from "./app-chrome";
import {
  AutoAddScreen,
  ComposeScreen,
  FeedScreen,
  HelpScreen,
} from "./screens";

type HomeProps = {
  email: string;
  isAdmin: boolean;
  initialProfile: UserProfile;
};

export default function Home({ email, isAdmin, initialProfile }: HomeProps) {
  const [screen, setScreen] = useState<Screen>("feed");
  const [cards, setCards] = useState<StudyCardData[]>([]);
  const [feedIds, setFeedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [profile, setProfile] = useState(initialProfile);
  const [masksRevealed, setMasksRevealed] = useState(false);
  const confirmResolver = useRef<((result: boolean) => void) | null>(null);
  const cardsRef = useRef<StudyCardData[]>([]);
  const loadingRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;

    void loadCards()
      .then((loaded) => {
        if (cancelled) return;
        setCards(loaded);
        cardsRef.current = loaded;
        setFeedIds(pickWeighted(loaded, 15));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setModal({
          type: "notice",
          message:
            error instanceof Error
              ? error.message
              : "カードを読み込めませんでした。",
        });
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    cardsRef.current = cards;
    if (!hydrated) return;

    saveQueueRef.current = saveQueueRef.current
      .then(() => saveCards(cards))
      .catch((error: unknown) => {
        setModal({
          type: "notice",
          message:
            error instanceof Error
              ? error.message
              : "カードを保存できませんでした。",
        });
      });
  }, [cards, hydrated]);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current || screen !== "feed") return;
      if (
        window.scrollY + window.innerHeight >
        document.body.offsetHeight - 400
      ) {
        loadingRef.current = true;
        setFeedIds((current) => [
          ...current,
          ...pickWeighted(cardsRef.current, 5),
        ]);
        window.setTimeout(() => {
          loadingRef.current = false;
        }, 150);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [screen]);

  const cardsById = useMemo(
    () => new Map(cards.map((card) => [card.id, card])),
    [cards],
  );

  const feedItems = useMemo(
    () =>
      feedIds.flatMap((id, index) => {
        const card = cardsById.get(id);
        return card ? [{ instanceId: `${id}-${index}`, card }] : [];
      }),
    [cardsById, feedIds],
  );

  const showNotice = (message: string) => {
    setModal({ type: "notice", message });
  };

  const showConfirm = (message: string) => {
    setModal({ type: "confirm", message });
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
    });
  };

  const closeModal = (result: boolean) => {
    const resolver = confirmResolver.current;
    confirmResolver.current = null;
    setModal(null);
    resolver?.(result);
  };

  const updateCard = (id: string, changes: CardChanges) => {
    setCards((current) =>
      current.map((card) => (card.id === id ? { ...card, ...changes } : card)),
    );
  };

  const deleteCard = (id: string) => {
    setCards((current) => current.filter((card) => card.id !== id));
    setFeedIds((current) => current.filter((cardId) => cardId !== id));
  };

  const submitPost = (
    text: string,
    image: string | null,
    maskedRanges: TextRange[],
  ) => {
    const newCards = createPostCards(text, image, maskedRanges);
    if (!newCards.length) {
      setScreen("feed");
      return;
    }

    setCards((current) => [...newCards, ...current]);
    setFeedIds((current) => [...newCards.map((card) => card.id), ...current]);
    setScreen("feed");
  };

  const clearAll = async () => {
    const confirmed = await showConfirm(
      "登録した全てのカードを削除して初期状態に戻します。よろしいですか？",
    );
    if (!confirmed) return;
    setCards([]);
    setFeedIds([]);
    showNotice("初期状態に戻しました。");
  };

  const addSamples = (subjects: string[]) => {
    if (!subjects.length) {
      showNotice("教科を選んでください");
      return;
    }

    const newCards = createSampleCards(subjects);
    const nextCards = [...newCards, ...cards];
    setCards(nextCards);
    setFeedIds(pickWeighted(nextCards, 15));
    setScreen("feed");
    showNotice(`${newCards.length}件のサンプルカードを追加しました`);
  };

  return (
    <main className="min-h-screen bg-white pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] text-ink dark:bg-black dark:text-ink-dark">
      {screen === "feed" && (
        <FeedScreen
          email={email}
          isAdmin={isAdmin}
          profile={profile}
          onProfileChange={setProfile}
          items={feedItems}
          isEmpty={hydrated && cards.length === 0}
          onHelp={() => setScreen("help")}
          onClear={clearAll}
          masksRevealed={masksRevealed}
          onToggleMasks={() => setMasksRevealed((current) => !current)}
          onCardChange={updateCard}
          onCardDelete={deleteCard}
          onNotice={showNotice}
        />
      )}
      {screen === "compose" && (
        <ComposeScreen
          onClose={() => setScreen("feed")}
          onSubmit={submitPost}
          onNotice={showNotice}
        />
      )}
      {screen === "auto" && (
        <AutoAddScreen
          onClose={() => setScreen("feed")}
          onSubmit={addSamples}
        />
      )}
      {screen === "help" && <HelpScreen onClose={() => setScreen("feed")} />}

      {modal && <AppModal modal={modal} onClose={closeModal} />}
      <BottomNav screen={screen} onNavigate={setScreen} />
    </main>
  );
}
