import HomeApp from "@/app/components/home-app";
import { auth, isAdminEmail } from "@/app/lib/auth";
import { getPrisma } from "@/app/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const user = await getPrisma().user.findUnique({
    where: { id: session.user.id },
    select: { name: true, username: true },
  });

  return (
    <HomeApp
      email={session.user.email}
      isAdmin={isAdminEmail(session.user.email)}
      initialProfile={{
        name: user?.name || session.user.name || "暗記ノート",
        username: user?.username || "studwitter",
      }}
    />
  );
}
