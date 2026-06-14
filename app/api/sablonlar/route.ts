import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { sablonSchema } from "@/lib/sablon";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import type { Prisma, SablonTur } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

/** GET — şablonlar (yönetici). ?tur=FORM|VERI_TABLOSU ile süzülebilir. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const turParam = req.nextUrl.searchParams.get("tur");
  const tur = turParam === "FORM" || turParam === "VERI_TABLOSU" ? (turParam as SablonTur) : undefined;

  const sablonlar = await prisma.sablon.findMany({
    where: tur ? { tur } : {},
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sablonlar);
}

/** POST — yeni şablon (mevcut form/tablo iskeletinden) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const r = await parseJson(req, sablonSchema);
  if ("error" in r) return r.error;
  const { ad, aciklama, tur, icerik } = r.data;

  const sablon = await prisma.sablon.create({
    data: {
      ad, aciklama, tur,
      icerik: icerik as Prisma.InputJsonValue,
      createdById: session.user.id,
      createdByName: `${session.user.ad} ${session.user.soyad}`,
    },
  });
  return NextResponse.json(sablon, { status: 201 });
}
