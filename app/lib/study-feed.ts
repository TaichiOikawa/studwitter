export type Screen = "feed" | "compose" | "auto" | "help";

export type StudyCardData = {
  id: string;
  text: string;
  likes: number;
  createdAt: number;
  note: string;
  image: string | null;
  auto: boolean;
};

export type CardChanges = Partial<
  Pick<StudyCardData, "text" | "likes" | "note" | "image">
>;

export const IMAGE_LIMIT = 800 * 1024;

export const SAMPLE_BANK: Record<string, string[]> = {
  国語: [
    "「枕草子」の作者は清少納言で、平安時代中期に成立した随筆である",
    "「徒然草」の作者は兼好法師(吉田兼好)で、鎌倉時代末期の随筆である",
    "漢文の「レ点」は一字だけ返って読むことを示す返り点である",
  ],
  数学: [
    "二次方程式ax²+bx+c=0の解の公式はx=(-b±√(b²-4ac))/2aである",
    "三角形の内角の和は180度である",
    "等比数列の一般項はa_n=a・r^(n-1)で表される",
  ],
  英語: [
    "現在完了形はhave/has+過去分詞で表し、過去から現在までの継続・経験・完了を表す",
    "仮定法過去は現在の事実に反する仮定を表す際に用いる",
    "関係代名詞whoは先行詞が人のときに使う",
  ],
  理科: [
    "光合成は植物が光エネルギーを使い二酸化炭素と水からデンプンと酸素を作る反応である",
    "慣性の法則は外力が働かない限り物体が等速直線運動を続けるという法則である",
    "原子は原子核と電子から構成される",
  ],
  社会: [
    "鎌倉幕府は源頼朝によって開かれ、1192年に征夷大将軍に任命されたとされる",
    "三権分立とは立法・行政・司法の権力を分立させる仕組みである",
    "日本国憲法の三大原則は国民主権・基本的人権の尊重・平和主義である",
  ],
};

export const SUBJECTS = Object.keys(SAMPLE_BANK);

async function getApiError(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : null;
  } catch {
    return null;
  }
}

export async function loadCards(): Promise<StudyCardData[]> {
  const response = await fetch("/api/cards", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      (await getApiError(response)) ?? "カードを読み込めませんでした。",
    );
  }

  const body = (await response.json()) as { cards?: unknown };
  if (!Array.isArray(body.cards)) {
    throw new Error("カード一覧の形式が正しくありません。");
  }

  return body.cards as StudyCardData[];
}

export async function saveCards(cards: StudyCardData[]) {
  const response = await fetch("/api/cards", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards }),
  });

  if (!response.ok) {
    throw new Error(
      (await getApiError(response)) ?? "カードを保存できませんでした。",
    );
  }
}

function normalizePostText(raw: string) {
  const text = raw.trim().replace(/[ \t]+/g, " ");
  return text;
}

export function createPostCards(
  raw: string,
  image: string | null,
): StudyCardData[] {
  const text = normalizePostText(raw);
  if (!text) return [];

  const now = Date.now();
  return [
    {
      id: `${now}${Math.random().toString(36).slice(2, 7)}`,
      text,
      likes: 0,
      createdAt: now,
      note: "",
      image,
      auto: false,
    },
  ];
}

export function createSampleCards(subjects: string[]): StudyCardData[] {
  const now = Date.now();
  return subjects.flatMap((subject) =>
    [...SAMPLE_BANK[subject]]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((text, index) => ({
        id: `${now}${Math.random().toString(36).slice(2, 7)}${subject}${index}`,
        text,
        likes: 0,
        createdAt: now,
        note: "",
        image: null,
        auto: true,
      })),
  );
}

export function pickWeighted(cards: StudyCardData[], count: number) {
  if (!cards.length) return [];
  const total = cards.reduce((sum, card) => sum + card.likes + 1, 0);

  return Array.from({ length: count }, () => {
    let remaining = Math.random() * total;
    for (const card of cards) {
      remaining -= card.likes + 1;
      if (remaining <= 0) return card.id;
    }
    return cards[cards.length - 1].id;
  });
}

export function relativeTime(timestamp: number) {
  if (!timestamp) return "今";
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return "たった今";
  if (diff < 3600) return `${Math.floor(diff / 60)}分`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間`;
  return `${Math.floor(diff / 86400)}日`;
}

export function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
