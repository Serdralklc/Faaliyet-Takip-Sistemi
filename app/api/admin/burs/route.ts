import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { BursBasvuruDurum } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";


const VALID_DURUM: BursBasvuruDurum[] = ["BEKLEMEDE", "INCELENIYOR", "ONAYLANDI", "REDDEDILDI"];

function isAdmin(session: { user?: { role?: string } } | null) {
  return ["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(session?.user?.role ?? "");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const durum = searchParams.get("durum") || undefined;

  const list = await prisma.bursBasvuru.findMany({
    where: durum ? { durum: durum as BursBasvuruDurum } : {},
    orderBy: { createdAt: "desc" },
    include: {
      volunteer: { select: { adSoyad: true, telefon: true, email: true } },
    },
  });

  return NextResponse.json(list);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id, durum, yoneticiNotu } = await req.json();
  if (!id || !durum || !VALID_DURUM.includes(durum)) {
    return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
  }

  const updated = await prisma.bursBasvuru.update({
    where: { id },
    data:  { durum, yoneticiNotu: yoneticiNotu ?? undefined },
  });

  return NextResponse.json({ ok: true, updated });
}
