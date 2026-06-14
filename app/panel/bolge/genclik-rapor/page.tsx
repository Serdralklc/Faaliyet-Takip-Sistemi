export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GenclikBolgeDashboard } from "@/app/panel/bolge/GenclikBolgeDashboard";
import { bolgeGenclikFaaliyetler } from "@/lib/genclik-veri";

// Bölge Üniversite / Lise Gençlik Sorumlusu — Raporlar (gelişmiş filtre + dönem karşılaştırması)
export default async function BolgeGenclikRaporPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");

  const sistem = session.user.sistem;
  if (sistem !== "UNIVERSITE" && sistem !== "LISE") redirect("/panel/bolge/raporlar");

  const bolgeId = session.user.activeBolgeId;
  if (!bolgeId) redirect("/panel/beklemede");

  const bolgeAd = (await prisma.bolge.findUnique({ where: { id: bolgeId }, select: { ad: true } }))?.ad ?? "Bölge";
  const { faaliyetler } = await bolgeGenclikFaaliyetler(bolgeId, sistem);

  return (
    <GenclikBolgeDashboard
      sistem={sistem}
      baslik={`${bolgeAd} — Raporlar`}
      altBaslik={`${sistem === "UNIVERSITE" ? "Üniversite" : "Lise"} Gençlik — il / dönem / faaliyet karşılaştırmalı analizler`}
      faaliyetler={faaliyetler}
      faaliyetHref="/panel/bolge/genclik-faaliyet"
      raporMod
    />
  );
}
