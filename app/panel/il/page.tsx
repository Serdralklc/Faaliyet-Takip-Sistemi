export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import IlDashboardClient from "./IlDashboardClient";

export default async function IlDashboard() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "IL_SORUMLUSU") redirect("/");

  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");

  const [il, faaliyetler, evSayisi, apartSayisi, yurtSayisi, ziyaretSayisi, ilHedefler] = await Promise.all([
    prisma.il.findUnique({ where: { id: ilId }, include: { bolge: true } }),
    prisma.activity.findMany({
      where: { ilId },
      orderBy: [{ yil: "desc" }, { donem: "asc" }],
    }),
    prisma.housingUnit.count({ where: { ilId, tip: "EV",    aktif: true } }),
    prisma.housingUnit.count({ where: { ilId, tip: "APART", aktif: true } }),
    prisma.housingUnit.count({ where: { ilId, tip: "YURT",  aktif: true } }),
    prisma.housingVisit.count({ where: { housingUnit: { ilId } } }),
    prisma.ilHedef.findMany({
      where: { ilId },
      orderBy: [{ yil: "desc" }, { donem: "asc" }],
    }),
  ]);

  if (!il) redirect("/panel/beklemede");

  return (
    <IlDashboardClient
      il={il}
      faaliyetler={faaliyetler}
      evSayisi={evSayisi}
      apartSayisi={apartSayisi}
      yurtSayisi={yurtSayisi}
      ziyaretSayisi={ziyaretSayisi}
      ilHedefler={ilHedefler}
    />
  );
}
