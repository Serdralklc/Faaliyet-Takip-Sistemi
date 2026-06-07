export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BolgePerformansClient from "./BolgePerformansClient";

export default async function BolgePerformansPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");

  const bolgeId = session.user.activeBolgeId;
  if (!bolgeId) redirect("/panel/beklemede");

  const [bolge, bolgeHedefler] = await Promise.all([
    prisma.bolge.findUnique({
      where: { id: bolgeId },
      include: {
        iller: {
          orderBy: { ad: "asc" },
          include: {
            activities: { orderBy: [{ yil: "desc" }, { donem: "asc" }] },
            hedefler: true,
          },
        },
      },
    }),
    prisma.bolgeHedef.findMany({
      where: { bolgeId },
      orderBy: [{ yil: "desc" }, { donem: "asc" }],
      include: {
        ilHedef: { include: { il: { select: { id: true, ad: true } } } },
      },
    }),
  ]);

  if (!bolge) redirect("/panel/beklemede");

  return <BolgePerformansClient bolge={bolge} bolgeHedefler={bolgeHedefler} />;
}
