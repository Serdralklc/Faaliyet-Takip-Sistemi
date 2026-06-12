import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SUPER_ADMIN_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Gönüllü sistemi özet sayıları — tam listeler yerine count() kullanır.
 * (Eski yöntem: 3 tablonun TÜM satırlarını indirip .length almak)
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user || !SUPER_ADMIN_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const [gonullu, burs, bursBekleyen, ekKayit, ekKayitBekleyen, geriBildirim, geriBildirimYeni] =
    await Promise.all([
      prisma.volunteer.count(),
      prisma.bursBasvuru.count(),
      prisma.bursBasvuru.count({ where: { durum: "BEKLEMEDE" } }),
      prisma.ekKayitBasvuru.count(),
      prisma.ekKayitBasvuru.count({ where: { durum: "BEKLEMEDE" } }),
      prisma.geriBildirim.count(),
      prisma.geriBildirim.count({ where: { durum: "YENI" } }),
    ]);

  return NextResponse.json({
    gonullu,
    burs,
    bursBekleyen,
    ekKayit,
    ekKayitBekleyen,
    geriBildirim,
    geriBildirimYeni,
  });
}
