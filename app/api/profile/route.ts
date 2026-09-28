import { auth } from "@/app/lib/auth";
import { getPrisma } from "@/app/lib/prisma";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function parseProfile(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new Error("リクエストの形式が正しくありません。");
  }

  const profile = value as Record<string, unknown>;
  const name = typeof profile.name === "string" ? profile.name.trim() : "";
  const username =
    typeof profile.username === "string"
      ? profile.username.trim().replace(/^@/, "").toLowerCase()
      : "";

  if (!name || name.length > 40) {
    throw new Error("表示名は1〜40文字で入力してください。");
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new Error(
      "ユーザー名は3〜20文字の半角英小文字・数字・アンダースコアで入力してください。",
    );
  }

  return { name, username };
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let profile: ReturnType<typeof parseProfile>;
  try {
    profile = parseProfile(await request.json());
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
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: profile,
      select: { name: true, username: true },
    });

    return Response.json({ profile: user });
  } catch {
    return Response.json(
      { error: "プロフィールを更新できませんでした。" },
      { status: 500 },
    );
  }
}
