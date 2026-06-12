import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Öğr. Evi / Apart / Yurt başvuruları — rol kapsamlı liste.
 * - Yönetici rolleri: tümü
 * - BOLGE_SORUMLUSU: gideceği bölgesi kendi bölgesi olan VEYA gideceği ili bölgesinin illerinden olan başvurular
 * - IL_SORUMLUSU: gideceği ili kendi ili olan başvurular
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { role, activeIlAd, activeBolgeId, activeBolgeAd } = session.user;

  let where: Record<string, unknown> = {};

  if (YONETICI_ROLLERI.includes(role as Role)) {
    where = {};
  } else if (role === "BOLGE_SORUMLUSU") {
    if (!activeBolgeId) return NextResponse.json([]);
    const iller = await prisma.il.findMany({ where: { bolgeId: activeBolgeId }, select: { ad: true } });
    where = {
      OR: [
        ...(activeBolgeAd ? [{ gidecegiBolge: { equals: activeBolgeAd, mode: "insensitive" } }] : []),
        { gidecegiIl: { in: iller.map(i => i.ad), mode: "insensitive" } },
      ],
    };
  } else if (role === "IL_SORUMLUSU") {
    if (!activeIlAd) return NextResponse.json([]);
    where = { gidecegiIl: { equals: activeIlAd, mode: "insensitive" } };
  } else {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const basvurular = await prisma.ekKayitBasvuru.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { volunteer: { select: { adSoyad: true, telefon: true, email: true } } },
  });

  return NextResponse.json(basvurular);
}
