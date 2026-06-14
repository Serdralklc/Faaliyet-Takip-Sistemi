export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BarinmaGorunumClient } from "@/app/panel/admin/barinma-gorunum/BarinmaGorunumClient";

// İl Üniversite Gençlik Sorumlusu: kendi ilinin barınma birimlerini (ev/apart/yurt +
// öğrenci + ziyaret) salt görüntüler. (/api/housing-units canAccessIl ile kendi iline kısıtlı.)
export default async function IlBarinmaGorunumPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "IL_SORUMLUSU") redirect("/");
  // Yalnız Üniversite Gençlik il sorumlusu (Lise Gençlik'te barınma yok; Eğitim ili tam yönetimi kullanır).
  if (session.user.sistem !== "UNIVERSITE") redirect("/panel/il");

  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");

  const il = await prisma.il.findUnique({ where: { id: ilId }, select: { id: true, ad: true } });
  if (!il) redirect("/panel/beklemede");

  return <BarinmaGorunumClient sabitIller={[il]} />;
}
