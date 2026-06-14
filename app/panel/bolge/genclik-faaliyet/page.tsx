export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IlFaaliyetClient } from "@/app/panel/admin/il-faaliyet/IlFaaliyetClient";

// Bölge Eğitim Sorumlusu: kendi bölgesindeki illerin Üniversite & Lise Gençlik
// faaliyetlerini il-il salt görüntüler. (/api/*-faaliyetler bölgeye + seçilen ile kısıtlar.)
export default async function BolgeGenclikFaaliyetPage({
  searchParams,
}: {
  searchParams: Promise<{ sistem?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");

  const bolgeId = session.user.activeBolgeId;
  if (!bolgeId) redirect("/panel/beklemede");
  const iller = await prisma.il.findMany({
    where: { bolgeId },
    orderBy: { ad: "asc" },
    select: { id: true, ad: true },
  });

  // Eğitim bölge → üni+lise (cross-system görüntü); ?sistem ile tek sisteme daraltılır
  // (Faaliyet Takip açılırındaki Üni/Lise sekmeleri). Üni/Lise bölge → yalnız kendi sistemi.
  const s = session.user.sistem;
  const sp = await searchParams;
  const istenen = sp.sistem === "UNIVERSITE" || sp.sistem === "LISE" ? sp.sistem : null;
  const taban = s === "UNIVERSITE" ? ["UNIVERSITE"] : s === "LISE" ? ["LISE"] : ["UNIVERSITE", "LISE"];
  const sistemler = (istenen && taban.includes(istenen) ? [istenen] : taban) as ("UNIVERSITE" | "LISE")[];
  return <IlFaaliyetClient sistemler={sistemler} sabitIller={iller} />;
}
