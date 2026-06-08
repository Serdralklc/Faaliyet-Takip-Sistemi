export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BolgelerClient } from "./BolgelerClient";
import type { Sistem } from "@/app/generated/prisma/client";

export default async function BolgelerPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  const { role, sistem: userSistem } = session.user;
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"].includes(role)) redirect("/");

  const SISTEM_KISITLI = ["TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  // Sistem kısıtlı roller yalnızca kendi sistemini görür
  const SISTEMLER: Sistem[] = SISTEM_KISITLI.includes(role) && userSistem
    ? [userSistem as Sistem]
    : ["EGITIMCI", "UNIVERSITE", "LISE"];

  // Her sistem için bölge+il verisi çek
  const sistemVerileri = await Promise.all(
    SISTEMLER.map(async (sistem) => {
      const bolgeler = await prisma.bolge.findMany({
        orderBy: { no: "asc" },
        include: {
          iller: {
            orderBy: { ad: "asc" },
            include: {
              // Bu sisteme atanmış aktif il sorumlusu
              assignments: {
                where: { status: "AKTIF", user: { sistem } },
                include: { user: { select: { id: true, ad: true, soyad: true, email: true } } },
                take: 1,
              },
              // Bu sistemin son faaliyeti
              activities: {
                where: { createdBy: { sistem } },
                orderBy: [{ yil: "desc" }, { donem: "desc" }],
                take: 1,
                select: { yil: true, donem: true, createdAt: true },
              },
            },
          },
        },
      });

      return {
        sistem,
        bolgeler: bolgeler.map(b => ({
          id: b.id, no: b.no, ad: b.ad,
          iller: b.iller.map(il => ({
            id:    il.id,
            ad:    il.ad,
            sorumlu: il.assignments[0]?.user
              ? {
                  adSoyad: `${il.assignments[0].user.ad} ${il.assignments[0].user.soyad}`,
                  email:   il.assignments[0].user.email,
                }
              : null,
            sonFaaliyet: il.activities[0]
              ? {
                  yil:       il.activities[0].yil,
                  donem:     il.activities[0].donem,
                  createdAt: il.activities[0].createdAt.toISOString(),
                }
              : null,
          })),
        })),
      };
    })
  );

  return <BolgelerClient sistemVerileri={sistemVerileri} lockedSistem={SISTEM_KISITLI.includes(role) ? userSistem as Sistem ?? null : null} />;
}
