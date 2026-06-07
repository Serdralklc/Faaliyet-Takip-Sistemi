import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const ilId = req.nextUrl.searchParams.get("ilId") || session.user.activeIlId;
  if (!ilId) return NextResponse.json([]);

  const visits = await prisma.housingVisit.findMany({
    where: { housingUnit: { ilId } },
    orderBy: { tarih: "desc" },
    include: { housingUnit: { select: { ad: true, tip: true } } },
  });
  return NextResponse.json(visits);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { housingUnitId, tarih, ziyaretEden, notlar } = body;

  if (!housingUnitId || !tarih || !ziyaretEden) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const visit = await prisma.housingVisit.create({
    data: {
      housingUnitId,
      tarih: new Date(tarih),
      ziyaretEden,
      notlar: notlar || null,
    },
    include: { housingUnit: { select: { ad: true, tip: true } } },
  });
  return NextResponse.json(visit);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.housingVisit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
