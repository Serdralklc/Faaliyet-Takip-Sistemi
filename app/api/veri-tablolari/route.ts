import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { veriTabloSchema } from "@/lib/veri-tablosu";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

/** GET — tüm veri tabloları (yönetici) */
export async function GET() {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }
  const tablolar = await prisma.veriTablosu.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { kayitlar: true, sutunlar: true } } },
  });
  return NextResponse.json(tablolar);
}

/** POST — yeni veri tablosu (taslak) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }
  const r = await parseJson(req, veriTabloSchema);
  if ("error" in r) return r.error;
  const { sutunlar, ...meta } = r.data;

  const tablo = await prisma.veriTablosu.create({
    data: {
      ...meta,
      createdById: session.user.id,
      createdByName: `${session.user.ad} ${session.user.soyad}`,
      sutunlar: { create: sutunlar.map((s, i) => ({ ...s, sira: i })) },
    },
    include: { sutunlar: { orderBy: { sira: "asc" } } },
  });
  return NextResponse.json(tablo, { status: 201 });
}
