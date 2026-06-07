import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { housingUnitId, adSoyad, bolum, sinif, bursMu, disiplinSayisi, iliskiKesme, notlar } = body;

  if (!housingUnitId || !adSoyad) return NextResponse.json({ error: "Eksik alan" }, { status: 400 });

  const student = await prisma.housingStudent.create({
    data: {
      housingUnitId,
      adSoyad,
      bolum: bolum || null,
      sinif: sinif || null,
      bursMu: bursMu ?? false,
      disiplinSayisi: disiplinSayisi ?? 0,
      iliskiKesme: iliskiKesme ?? false,
      notlar: notlar || null,
    },
  });
  return NextResponse.json(student);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { id, adSoyad, bolum, sinif, bursMu, disiplinSayisi, iliskiKesme, notlar } = body;

  const student = await prisma.housingStudent.update({
    where: { id },
    data: { adSoyad, bolum, sinif, bursMu, disiplinSayisi, iliskiKesme, notlar },
  });
  return NextResponse.json(student);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.housingStudent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
