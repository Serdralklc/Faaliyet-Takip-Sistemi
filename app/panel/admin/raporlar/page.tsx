export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RaporlarClient } from "./RaporlarClient";

export default async function RaporlarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU"].includes(session.user.role)) redirect("/");

  // Tüm bölgeleri illerle ve faaliyetlerle çek
  const bolgeler = await prisma.bolge.findMany({
    orderBy: { no: "asc" },
    include: {
      iller: {
        orderBy: { ad: "asc" },
        include: {
          activities: {
            orderBy: [{ yil: "desc" }, { donem: "asc" }],
          },
        },
      },
    },
  });

  // Mevcut yıllar
  const tumFaaliyetler = bolgeler.flatMap(b => b.iller.flatMap(i => i.activities));
  const yillar = [...new Set(tumFaaliyetler.map(f => f.yil))].sort((a, b) => b - a);

  return (
    <RaporlarClient
      bolgeler={bolgeler.map(b => ({
        id: b.id,
        no: b.no,
        ad: b.ad,
        iller: b.iller.map(il => ({
          id: il.id,
          ad: il.ad,
          activities: il.activities,
        })),
      }))}
      yillar={yillar}
    />
  );
}
