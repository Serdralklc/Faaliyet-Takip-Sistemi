export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RaporlarClient } from "./RaporlarClient";
import { LiseRaporClient } from "./LiseRaporClient";
import type { Sistem } from "@/app/generated/prisma/client";

export default async function RaporlarPage({
  searchParams,
}: {
  searchParams: Promise<{ sistem?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"].includes(session.user.role)) redirect("/");

  const params = await searchParams;
  const VALID: Sistem[] = ["EGITIMCI", "UNIVERSITE", "LISE"];
  const sistem: Sistem = VALID.includes(params.sistem as Sistem)
    ? (params.sistem as Sistem)
    : "EGITIMCI";

  // Lise Gençlik: faaliyet-bazlı LiseFaaliyet kayıtlarından otomatik toplama
  if (sistem === "LISE") {
    const [bolgeler, liseFaal] = await Promise.all([
      prisma.bolge.findMany({ orderBy: { no: "asc" }, select: { id: true, no: true, ad: true, iller: { select: { id: true, ad: true } } } }),
      prisma.liseFaaliyet.findMany({ select: { ilId: true, yil: true, kategori: true, katilimci: true, ilkKezKatilan: true, yeniIntisap: true } }),
    ]);
    const lyillar = [...new Set(liseFaal.map(f => f.yil))].sort((a, b) => b - a);
    if (!lyillar.includes(new Date().getFullYear())) lyillar.unshift(new Date().getFullYear());
    return <LiseRaporClient bolgeler={bolgeler} faaliyetler={liseFaal} yillar={lyillar} />;
  }

  // Bölgeler + iller + bu sisteme ait faaliyetler (Eğitimci / Üniversite)
  const bolgeler = await prisma.bolge.findMany({
    orderBy: { no: "asc" },
    include: {
      iller: {
        orderBy: { ad: "asc" },
        include: {
          activities: {
            where: { createdBy: { sistem } },
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
      sistem={sistem}
      bolgeler={bolgeler.map(b => ({
        id: b.id, no: b.no, ad: b.ad,
        iller: b.iller.map(il => ({
          id: il.id, ad: il.ad, activities: il.activities,
        })),
      }))}
      yillar={yillar}
    />
  );
}
