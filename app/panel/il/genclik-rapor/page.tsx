export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GenclikBolgeDashboard } from "@/app/panel/bolge/GenclikBolgeDashboard";
import { ilGenclikFaaliyetler } from "@/lib/genclik-veri";

// İl Üniversite / Lise Gençlik Sorumlusu — Raporlar (kendi ili, gelişmiş filtre + dönem karşılaştırması)
export default async function IlGenclikRaporPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "IL_SORUMLUSU") redirect("/");

  const sistem = session.user.sistem;
  if (sistem !== "UNIVERSITE" && sistem !== "LISE") redirect("/panel/il/raporlar");

  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");

  const il = await prisma.il.findUnique({ where: { id: ilId }, select: { ad: true } });
  if (!il) redirect("/panel/beklemede");
  const faaliyetler = await ilGenclikFaaliyetler(ilId, il.ad, sistem);
  const faaliyetHref = sistem === "UNIVERSITE" ? "/panel/il/universite-faaliyet" : "/panel/il/lise-faaliyet";

  return (
    <GenclikBolgeDashboard
      sistem={sistem}
      baslik={`${il.ad} — Raporlar`}
      altBaslik={`${sistem === "UNIVERSITE" ? "Üniversite" : "Lise"} Gençlik — dönem / faaliyet karşılaştırmalı analizler`}
      faaliyetler={faaliyetler}
      faaliyetHref={faaliyetHref}
      raporMod
    />
  );
}
