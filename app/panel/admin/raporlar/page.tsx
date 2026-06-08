export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RaporlarClient } from "./RaporlarClient";
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

  // Bölgeler + iller + bu sisteme ait faaliyetler
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
