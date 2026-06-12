export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Donem } from "@/app/generated/prisma/client";
import { birimDurum, ilTamam, BIRIMLER, type BirimDurum, type BirimKey } from "@/lib/birimDurum";
import { BolgeDashboardClient, type IlDurum } from "./BolgeDashboardClient";

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
    const a = (il.activities[0] ?? null) as Record<string, unknown> | null;
    const sorumlu = il.assignments[0]?.user ?? null;
    const durumlar = Object.fromEntries(
      BIRIMLER.map(b => [b, birimDurum(a, b)])
    ) as Record<BirimKey, BirimDurum>;
    return {
      id: il.id,
      ad: il.ad,
      sorumlu: sorumlu ? `${sorumlu.ad} ${sorumlu.soyad}` : null,
      sorumluAtanmis: !!sorumlu,
      durumlar,
      veriVar: !!a,
      tamam: ilTamam(a),
    };
  });

  return (
    <BolgeDashboardClient
      bolgeAd={bolge?.ad ?? "Bölge"}
      iller={iller}
      yil={yil}
      donem={donem}
      yillar={yillar}
    />
  );
}
