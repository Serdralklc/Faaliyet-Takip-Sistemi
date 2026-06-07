import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { GeriBildirimDurum, GeriBildirimKonu } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";


const VALID_DURUM: GeriBildirimDurum[] = ["YENI", "INCELENIYOR", "COZULDU", "KAPATILDI"];

function isAdmin(session: { user?: { role?: string } } | null) {
  return ["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(session?.user?.role ?? "");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const durum = searchParams.get("durum") as GeriBildirimDurum | null;
  const konu  = searchParams.get("konu")  as GeriBildirimKonu  | null;

  const list = await prisma.geriBildirim.findMany({
    where: {
      ...(durum ? { durum } : {}),
      ...(konu  ? { konu  } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      volunteer: { select: { adSoyad: true, telefon: true } },
    },
  });

  return NextResponse.json(list);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id, durum } = await req.json();
  if (!id || !durum || !VALID_DURUM.includes(durum)) {
    return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
  }

  await prisma.geriBildirim.update({ where: { id }, data: { durum } });
  return NextResponse.json({ ok: true });
}
