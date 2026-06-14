export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RaporlarClient } from "@/app/panel/admin/raporlar/RaporlarClient";

// Bölge Eğitim Sorumlusu — "Faaliyet Takip Sistemi > Eğitim Birimi":
// merkezdeki zengin rapor arayüzünün (birim sekmeleri + KAPSAM/yıl/dönem filtreleri +
// PDF/Excel/Word) aynısı, yalnız kendi bölgesinin illeriyle. Tek bölge beslendiği için
// KAPSAM otomatik o bölgeye (Bölge varsayılan) / illerine kısıtlıdır.
export default async function BolgeEgitimRaporPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");
  // Üni/Lise gençlik bölge sorumlusu kendi gençlik raporuna gider
  if (session.user.sistem === "UNIVERSITE" || session.user.sistem === "LISE") redirect("/panel/bolge/genclik-rapor");

  const bolgeId = session.user.activeBolgeId;
  if (!bolgeId) redirect("/panel/beklemede");

  const bolgeler = await prisma.bolge.findMany({
    where: { id: bolgeId },
    orderBy: { no: "asc" },
    include: {
      iller: {
        orderBy: { ad: "asc" },
        include: {
          activities: {
            where: { createdBy: { sistem: "EGITIMCI" } },
            orderBy: [{ yil: "desc" }, { donem: "asc" }],
          },
        },
      },
    },
  });

  const tumFaaliyetler = bolgeler.flatMap(b => b.iller.flatMap(i => i.activities));
  const yillar = [...new Set(tumFaaliyetler.map(f => f.yil))].sort((a, b) => b - a);
  if (!yillar.includes(new Date().getFullYear())) yillar.unshift(new Date().getFullYear());

  return (
    <RaporlarClient
      sistem="EGITIMCI"
      bolgeler={bolgeler.map(b => ({
        id: b.id, no: b.no, ad: b.ad,
        iller: b.iller.map(il => ({ id: il.id, ad: il.ad, activities: il.activities })),
      }))}
      yillar={yillar}
    />
  );
}
