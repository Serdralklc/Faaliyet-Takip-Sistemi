export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UniversiteFaaliyetClient } from "./UniversiteFaaliyetClient";

export default async function UniversiteFaaliyetPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  // Yalnızca Üniversite Gençlik sistemli il sorumlusu
  if (session.user.role !== "IL_SORUMLUSU" || session.user.sistem !== "UNIVERSITE") redirect("/panel/il");

  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");

  const il = await prisma.il.findUnique({ where: { id: ilId }, include: { bolge: true } });
  if (!il) redirect("/panel/beklemede");

  return <UniversiteFaaliyetClient ilId={ilId} ilAd={il.ad} bolgeAd={il.bolge.ad} />;
}
