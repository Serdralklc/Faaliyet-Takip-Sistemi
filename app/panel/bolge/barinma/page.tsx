export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BarinmaGorunumClient } from "@/app/panel/admin/barinma-gorunum/BarinmaGorunumClient";

// Bölge Eğitim Sorumlusu: kendi bölgesindeki illerin barınma birimlerini (ev/apart/yurt
// + öğrenci + ziyaret) il-il salt görüntüler. (/api/housing-units canAccessIl ile bölgeye kısıtlı.)
export default async function BolgeBarinmaPage() {
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

  return <BarinmaGorunumClient sabitIller={iller} />;
}
