export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Donem } from "@/app/generated/prisma/client";
import { birimDurum, ilTamam, BIRIMLER, type BirimDurum, type BirimKey } from "@/lib/birimDurum";
import { BolgeDashboardClient, type IlDurum } from "./BolgeDashboardClient";
import { GenclikBolgeDashboard } from "./GenclikBolgeDashboard";
import { bolgeGenclikFaaliyetler } from "@/lib/genclik-veri";
import { ANALIZ_TUM_ALANLAR } from "@/lib/analiz-sorular";

const DONEMLER: Donem[] = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];

export default async function BolgePanelPage({
  searchParams,
}: {
  searchParams: Promise<{ yil?: string; donem?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");

  const bolgeId = session.user.activeBolgeId;
  if (!bolgeId) redirect("/panel/beklemede");

  // Üni/Lise gençlik bölge sorumlusu: anasayfa = kendi sisteminin il-il + birim
  // (faaliyet türü) bazlı analizleri (eğitimci durum tablosu değil).
  const sistem = session.user.sistem;
  if (sistem === "UNIVERSITE" || sistem === "LISE") {
    const bolgeAd = (await prisma.bolge.findUnique({ where: { id: bolgeId }, select: { ad: true } }))?.ad ?? "Bölge";
    const { faaliyetler } = await bolgeGenclikFaaliyetler(bolgeId, sistem);
    return (
      <GenclikBolgeDashboard
        sistem={sistem}
        baslik={bolgeAd}
        altBaslik={`${sistem === "UNIVERSITE" ? "Üniversite" : "Lise"} Gençlik — bölge geneli faaliyet analizleri`}
        faaliyetler={faaliyetler}
        faaliyetHref="/panel/bolge/genclik-faaliyet"
      />
    );
  }

  const sp = await searchParams;

  // Bölgenin illerinin mevcut yıl listesi
  const iller0 = await prisma.il.findMany({ where: { bolgeId }, select: { id: true } });
  const ilIds = iller0.map(i => i.id);
  const yilKayitlari = ilIds.length
    ? await prisma.activity.findMany({
        where: { ilId: { in: ilIds } },
        distinct: ["yil"],
        select: { yil: true },
        orderBy: { yil: "desc" },
      })
    : [];
  const yillar = yilKayitlari.map(k => k.yil);

  const parsedYil = Number(sp.yil);
  const yil = Number.isInteger(parsedYil) && parsedYil > 0 ? parsedYil : (yillar[0] ?? new Date().getFullYear());
  const donem: Donem = DONEMLER.includes(sp.donem as Donem) ? (sp.donem as Donem) : "DONEM_1";

  const bolge = await prisma.bolge.findUnique({
    where: { id: bolgeId },
    select: {
      ad: true,
      iller: {
        orderBy: { ad: "asc" },
        select: {
          id: true,
          ad: true,
          barinmaYok: true,
          _count: { select: { housingUnits: true } },
          activities: { where: { yil, donem }, take: 1 },
          assignments: {
            where: { status: "AKTIF" },
            take: 1,
            include: { user: { select: { ad: true, soyad: true } } },
          },
        },
      },
    },
  });

  const iller: IlDurum[] = (bolge?.iller ?? []).map(il => {
    const aRaw = (il.activities[0] ?? null) as Record<string, unknown> | null;
    const sorumlu = il.assignments[0]?.user ?? null;
    // Barınma muafiyeti il-bazlı (Il.barinmaYok); barınma "girildi" ev/apart/yurt birimi varsa.
    const veri: Record<string, unknown> | null =
      (aRaw || il.barinmaYok || il._count.housingUnits > 0)
        ? { ...(aRaw ?? {}), barinmaYok: il.barinmaYok, _housingUnits: il._count.housingUnits }
        : null;
    const durumlar = Object.fromEntries(
      BIRIMLER.map(b => [b, birimDurum(veri, b)])
    ) as Record<BirimKey, BirimDurum>;
    return {
      id: il.id,
      ad: il.ad,
      sorumlu: sorumlu ? `${sorumlu.ad} ${sorumlu.soyad}` : null,
      sorumluAtanmis: !!sorumlu,
      durumlar,
      veriVar: !!aRaw,
      tamam: ilTamam(veri),
    };
  });

  // İl-il faaliyet analizi için her ilin (seçili dönem) alan değerleri
  const ilAnaliz = (bolge?.iller ?? []).map(il => {
    const a = (il.activities[0] ?? {}) as Record<string, unknown>;
    const row: Record<string, number | string> = { il: il.ad };
    for (const f of ANALIZ_TUM_ALANLAR) row[f] = Number(a[f]) || 0;
    return row;
  });

  // İl sorumlularının son aktiflik zamanı
  const ilAktiflik = await prisma.il.findMany({
    where: { bolgeId },
    orderBy: { ad: "asc" },
    select: {
      ad: true,
      assignments: {
        where: { status: "AKTIF", role: "IL_SORUMLUSU", user: { sistem: "EGITIMCI" } },
        take: 1,
        select: { user: { select: { ad: true, soyad: true, sonAktif: true } } },
      },
    },
  });

  const ilAktiflikData = ilAktiflik.map(il => ({
    ad: il.ad,
    sorumlu: il.assignments[0]?.user
      ? `${il.assignments[0].user.ad} ${il.assignments[0].user.soyad}`
      : null,
    sonAktif: il.assignments[0]?.user?.sonAktif?.toISOString() ?? null,
  }));

  return (
    <BolgeDashboardClient
      bolgeAd={bolge?.ad ?? "Bölge"}
      iller={iller}
      ilAnaliz={ilAnaliz}
      yil={yil}
      donem={donem}
      yillar={yillar}
      ilAktiflik={ilAktiflikData}
    />
  );
}
