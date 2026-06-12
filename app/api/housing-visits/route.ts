import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessIl, canAccessHousingUnit } from "@/lib/housing-access";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const ilId = req.nextUrl.searchParams.get("ilId") || session.user.activeIlId;
  if (!ilId) return NextResponse.json([]);
  if (!(await canAccessIl(session.user, ilId))) {
    return NextResponse.json({ error: "Bu ile erişim yetkiniz yok." }, { status: 403 });
  }

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

  const access = await canAccessHousingUnit(session.user, housingUnitId);
  if (access === null) return NextResponse.json({ error: "Birim bulunamadı." }, { status: 404 });
  if (!access) return NextResponse.json({ error: "Bu birime erişim yetkiniz yok." }, { status: 403 });

  const visit = await prisma.housingVisit.create({
    data: {
      housingUnitId,
      tarih: new Date(tarih),
      ziyaretEden,
      notlar: notlar || null,
    },
    include: { housingUnit: { select: { ad: true, tip: true } } },
  });
  createAuditLog({ userId: session.user.id, action: ACTIONS.HOUSING_VISIT_CREATED, entity: "HousingVisit", entityId: visit.id, newValue: { ziyaretEden, tarih }, description: `Ziyaret kaydı eklendi (${ziyaretEden})` }).catch(console.error);
  return NextResponse.json(visit);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const visit = await prisma.housingVisit.findUnique({
    where: { id },
    select: { housingUnit: { select: { ilId: true } } },
  });
  if (!visit) return NextResponse.json({ error: "Ziyaret bulunamadı." }, { status: 404 });
  if (!(await canAccessIl(session.user, visit.housingUnit.ilId))) {
    return NextResponse.json({ error: "Bu kayda erişim yetkiniz yok." }, { status: 403 });
  }

  await prisma.housingVisit.delete({ where: { id } });
  createAuditLog({ userId: session.user.id, action: ACTIONS.HOUSING_VISIT_DELETED, entity: "HousingVisit", entityId: id, description: "Ziyaret kaydı silindi" }).catch(console.error);
  return NextResponse.json({ ok: true });
}
