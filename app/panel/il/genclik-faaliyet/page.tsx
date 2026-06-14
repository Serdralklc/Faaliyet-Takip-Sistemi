export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IlFaaliyetClient } from "@/app/panel/admin/il-faaliyet/IlFaaliyetClient";

// İl Eğitim Sorumlusu: kendi ilindeki Üniversite & Lise Gençlik faaliyetlerini salt görüntüler.
// (/api/*-faaliyetler IL_SORUMLUSU'yu kendi iline kısıtlar.)
export default async function IlGenclikFaaliyetPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "IL_SORUMLUSU") redirect("/");

  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");
  const il = await prisma.il.findUnique({ where: { id: ilId }, select: { id: true, ad: true } });
  if (!il) redirect("/panel/beklemede");

  return <IlFaaliyetClient sistemler={["UNIVERSITE", "LISE"] as ("UNIVERSITE" | "LISE")[]} sabitIller={[il]} />;
}
