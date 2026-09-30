import { auth } from "@/app/lib/auth";
import { getPrisma } from "@/app/lib/prisma";

type TextRange = { start: number; end: number };

type CardInput = {
  id: string;
  text: string;
  likes: number;
  createdAt: number;
  note: string;
  image: string | null;
  auto: boolean;
  maskedRanges: TextRange[];
};

function parseMaskedRanges(value: unknown, textLength: number): TextRange[] {
  if (!Array.isArray(value) || value.length > 100) {
    throw new Error("目隠し範囲の形式が正しくありません。");
  }

  let previousEnd = 0;
  return value.map((range) => {
    if (!range || typeof range !== "object") {
      throw new Error("目隠し範囲の形式が正しくありません。");
    }
    const { start, end } = range as Record<string, unknown>;
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      (start as number) < previousEnd ||
      (start as number) >= (end as number) ||
      (end as number) > textLength
    ) {
      throw new Error("目隠し範囲の形式が正しくありません。");
    }
    previousEnd = end as number;
    return { start: start as number, end: end as number };
  });
}

function parseCard(value: unknown): CardInput {
  if (!value || typeof value !== "object") {
    throw new Error("カードの形式が正しくありません。");
  }

  const card = value as Record<string, unknown>;
  const validImage = card.image === null || typeof card.image === "string";

  if (
    typeof card.id !== "string" ||
    !card.id ||
    typeof card.text !== "string" ||
    !Number.isSafeInteger(card.likes) ||
    (card.likes as number) < 0 ||
    typeof card.createdAt !== "number" ||
    !Number.isFinite(card.createdAt) ||
    typeof card.note !== "string" ||
    !validImage ||
    typeof card.auto !== "boolean"
  ) {
    throw new Error("カードの形式が正しくありません。");
  }

  return {
    id: card.id,
    text: card.text,
    likes: card.likes as number,
    createdAt: card.createdAt,
    note: card.note,
    image: card.image as string | null,
    auto: card.auto,
    maskedRanges: parseMaskedRanges(card.maskedRanges, card.text.length),
  };
}

function parseCards(value: unknown) {
  if (!Array.isArray(value) || value.length > 1_000) {
    throw new Error("カード一覧の形式が正しくありません。");
  }

  return value.map(parseCard);
}

async function getSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  try {
    const prisma = getPrisma();
    const cards = await prisma.studyCard.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      cards: cards.map((card) => ({
        id: card.id,
        text: card.text,
        likes: card.likes,
        createdAt: card.createdAt.getTime(),
        note: card.note,
        image: card.image,
        auto: card.auto,
        maskedRanges: parseMaskedRanges(
          JSON.parse(card.maskedRanges) as unknown,
          card.text.length,
        ),
      })),
    });
  } catch {
    return Response.json(
      { error: "カードを読み込めませんでした。" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let cards: CardInput[];

  try {
    const body = (await request.json()) as { cards?: unknown };
    cards = parseCards(body.cards);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "リクエストの形式が正しくありません。",
      },
      { status: 400 },
    );
  }

  try {
    const prisma = getPrisma();
    for (const card of cards) {
      const { maskedRanges, ...cardData } = card;
      const data = {
        ...cardData,
        maskedRanges: JSON.stringify(maskedRanges),
        createdAt: new Date(card.createdAt),
        userId: session.user.id,
      };

      await prisma.studyCard.upsert({
        where: {
          userId_id: {
            userId: session.user.id,
            id: card.id,
          },
        },
        create: data,
        update: data,
      });
    }

    await prisma.studyCard.deleteMany({
      where: {
        userId: session.user.id,
        ...(cards.length > 0
          ? { id: { notIn: cards.map((card) => card.id) } }
          : {}),
      },
    });

    return Response.json({ saved: cards.length });
  } catch {
    return Response.json(
      { error: "カードを保存できませんでした。" },
      { status: 500 },
    );
  }
}
