import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const ilId = req.nextUrl.searchParams.get("ilId") || session.user.activeIlId;
  if (!ilId) return NextResponse.json([]);

  const units = await prisma.housingUnit.findMany({
    where: { ilId, aktif: true },
    orderBy: [{ tip: "asc" }, { ad: "asc" }],
    include: {
      ogrenciler: { orderBy: { adSoyad: "asc" } },
      ziyaretler: { orderBy: { tarih: "desc" } },
    },
  });
  return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { ilId, tip, ad, konum } = body;

  if (!ilId || !tip || !ad) return NextResponse.json({ error: "Eksik alan" }, { status: 400 });

  const unit = await prisma.housingUnit.create({
    data: { ilId, tip, ad, konum: konum || null },
  });
  return NextResponse.json(unit);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { id, ad, konum, aktif } = body;

  const unit = await prisma.housingUnit.update({
    where: { id },
    data: { ad, konum, aktif },
  });
  return NextResponse.json(unit);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.housingUnit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
