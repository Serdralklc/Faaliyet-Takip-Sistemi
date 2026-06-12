export const dynamic = 'force-dynamic'

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Donem } from "@/app/generated/prisma/client";
import { BolgeRaporlarClient } from "./BolgeRaporlarClient";

const DONEM_VALID: Donem[] = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];

export default async function BolgeRaporlarPage({
  searchParams,
}: {
  searchParams: Promise<{ yil?: string; donem?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");

  const bolgeId = session.user.activeBolgeId;
  if (!bolgeId) redirect("/panel/beklemede");

  // Bölgedeki illerin id'lerini al (mevcut yıllar + varsayılan yıl için)
  const bolgeIller = await prisma.il.findMany({
    where: { bolgeId },
    select: { id: true },
  });
  const ilIds = bolgeIller.map((i) => i.id);

  // Mevcut yıllar: bölge illerinin activity'lerinden distinct yıl listesi
  const yilRows = ilIds.length
    ? await prisma.activity.findMany({
        where: { ilId: { in: ilIds } },
        distinct: ["yil"],
        select: { yil: true },
        orderBy: { yil: "desc" },
      })
    : [];
  const yillar = yilRows.map((r) => r.yil);

  const THIS_YEAR = new Date().getFullYear();
  const defaultYil = yillar[0] ?? THIS_YEAR;

  const sp = await searchParams;
  const yil = Number(sp.yil) || defaultYil;
  const donem: Donem = sp.donem && DONEM_VALID.includes(sp.donem as Donem) ? (sp.donem as Donem) : "DONEM_1";

  const bolge = await prisma.bolge.findUnique({
    where: { id: bolgeId },
    include: {
      iller: {
        orderBy: { ad: "asc" },
        include: {
          activities: { where: { yil, donem } },
          assignments: {
            where: { status: "AKTIF" },
            include: { user: true },
            take: 1,
          },
        },
      },
    },
  });

  // Yıl listesinde seçili yıl yoksa başa ekle (manuel ?yil= ile gelinmiş olabilir)
  const yillarFull = yillar.includes(yil)
    ? yillar
    : [yil, ...yillar].sort((a, b) => b - a);

  const iller = (bolge?.iller ?? []).map((il) => {
    const a = il.activities[0];
    const sorumlu = il.assignments[0]?.user;
    return {
      id: il.id,
      ad: il.ad,
      sorumluAd: sorumlu ? `${sorumlu.ad} ${sorumlu.soyad}` : null,
      hasData: !!a,
      metrikler: {
        ik_elifBaOgrenci: a?.ik_elifBaOgrenci ?? 0,
        ik_kuranOgrenci: a?.ik_kuranOgrenci ?? 0,
        ls_toplamFaaliyet: a?.ls_toplamFaaliyet ?? 0,
        ls_yeniIntisap: a?.ls_yeniIntisap ?? 0,
        uni_toplamFaaliyet: a?.uni_toplamFaaliyet ?? 0,
        uni_yeniIntisap: a?.uni_yeniIntisap ?? 0,
        uni_kykBulusmaSayisi: a?.uni_kykBulusmaSayisi ?? 0,
        eay_toplamZiyaret: a?.eay_toplamZiyaret ?? 0,
      },
    };
  });

  return (
    <BolgeRaporlarClient
      bolgeAd={bolge?.ad ?? "Bölge"}
      iller={iller}
      yil={yil}
      donem={donem}
      yillar={yillarFull}
    />
  );
}
