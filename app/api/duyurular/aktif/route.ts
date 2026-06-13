import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET — şu an aktif (süre içinde) duyurular; tüm panel kullanıcıları için üst bant */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json([]);

  const now = new Date();
  const duyurular = await prisma.duyuru.findMany({
    where: { aktif: true, baslangic: { lte: now }, bitis: { gte: now } },
    orderBy: { createdAt: "desc" },
    select: { id: true, metin: true, link: true },
  });
  return NextResponse.json(duyurular);
}
