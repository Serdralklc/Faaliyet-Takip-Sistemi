import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GeriBildirimKonu } from "@/app/generated/prisma/client";
import { getGonulluFromCookie } from "@/lib/gonullu-auth";

export const dynamic = "force-dynamic";


const VALID_KONU: GeriBildirimKonu[] = ["ONERI", "TALEP", "TEKNIK_SORUN", "DIGER"];

export async function GET() {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const list = await prisma.geriBildirim.findMany({
    where: { volunteerId: session.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, konu: true, mesaj: true, durum: true, createdAt: true },
  });

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  try {
    const { konu, mesaj } = await req.json();

    if (!konu || !mesaj?.trim()) {
      return NextResponse.json({ error: "Konu ve mesaj zorunludur." }, { status: 400 });
    }

    if (!VALID_KONU.includes(konu)) {
      return NextResponse.json({ error: "Geçersiz konu." }, { status: 400 });
    }

    const fb = await prisma.geriBildirim.create({
      data: { volunteerId: session.id, konu, mesaj: mesaj.trim() },
    });

    return NextResponse.json({ ok: true, id: fb.id }, { status: 201 });
  } catch (err) {
    console.error("[gonullu/geri-bildirim POST]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
