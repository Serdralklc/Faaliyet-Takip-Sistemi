import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { barinmaGorunumYanRol } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** GET — aktif barınma birimi olan il id'leri (Barınma Görünümü "barınması olan iller" filtresi) */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json([]);
  const isAdmin = session.user.anaRol === "ADMIN" || session.user.role === "SISTEM_ADMIN";
  if (!isAdmin && !barinmaGorunumYanRol(session.user.yanRoller)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const rows = await prisma.housingUnit.findMany({
    where: { aktif: true },
    distinct: ["ilId"],
    select: { ilId: true },
  });
  return NextResponse.json(rows.map(r => r.ilId));
}
