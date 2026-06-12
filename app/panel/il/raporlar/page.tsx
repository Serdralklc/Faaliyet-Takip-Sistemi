export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RaporlarClient from "./RaporlarClient";

export default async function IlRaporlarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "IL_SORUMLUSU") redirect("/");
  if (session.user.sistem === "LISE") redirect("/panel/il/lise-faaliyet");
  if (session.user.sistem === "UNIVERSITE") redirect("/panel/il/universite-faaliyet");
  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");

  const [il, faaliyetler] = await Promise.all([
    prisma.il.findUnique({ where: { id: ilId }, include: { bolge: true } }),
    prisma.activity.findMany({
      where: { ilId },
      orderBy: [{ yil: "desc" }, { donem: "asc" }],
    }),
  ]);

  if (!il) redirect("/panel/beklemede");

  return (
    <RaporlarClient
      faaliyetler={faaliyetler}
      ilAd={il.ad}
      bolgeAd={il.bolge.ad}
    />
  );
}
