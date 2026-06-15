import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessIl, canAccessHousingUnit } from "@/lib/housing-access";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { z } from "zod";
import { parseJson, zId, zKisaMetin } from "@/lib/validation";

const unitPostSchema = z.object({
  ilId: zId,
  tip: z.enum(["EV", "APART", "YURT"]),
  ad: zKisaMetin,
  konum: z.string().trim().max(200).nullish(),
});
const unitPutSchema = z.object({
  id: zId,
  ad: zKisaMetin.optional(),
  konum: z.string().trim().max(200).nullish(),
  aktif: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const ilId = req.nextUrl.searchParams.get("ilId") || session.user.activeIlId;
  if (!ilId) return NextResponse.json([]);
  if (!(await canAccessIl(session.user, ilId))) {
    return NextResponse.json({ error: "Bu ile erişim yetkiniz yok." }, { status: 403 });
  }

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

  const r = await parseJson(req, unitPostSchema);
  if ("error" in r) return r.error;
  const { ilId, tip, ad, konum } = r.data;

  if (!(await canAccessIl(session.user, ilId))) {
    return NextResponse.json({ error: "Bu ile erişim yetkiniz yok." }, { status: 403 });
  }

  const unit = await prisma.housingUnit.create({
    data: { ilId, tip, ad, konum: konum || null },
  });
  createAuditLog({ userId: session.user.id, action: ACTIONS.HOUSING_UNIT_CREATED, entity: "HousingUnit", entityId: unit.id, newValue: { tip, ad }, description: `${tip} birimi eklendi: ${ad}` }).catch(console.error);
  return NextResponse.json(unit);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const r = await parseJson(req, unitPutSchema);
  if ("error" in r) return r.error;
  const { id, ad, konum, aktif } = r.data;

  const access = await canAccessHousingUnit(session.user, id);
  if (access === null) return NextResponse.json({ error: "Birim bulunamadı." }, { status: 404 });
  if (!access) return NextResponse.json({ error: "Bu birime erişim yetkiniz yok." }, { status: 403 });

  const unit = await prisma.housingUnit.update({
    where: { id },
    data: { ad, konum, aktif },
  });
  createAuditLog({ userId: session.user.id, action: ACTIONS.HOUSING_UNIT_UPDATED, entity: "HousingUnit", entityId: id, newValue: { ad, konum, aktif }, description: `Barınma birimi güncellendi: ${unit.ad}` }).catch(console.error);
  return NextResponse.json(unit);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const access = await canAccessHousingUnit(session.user, id);
  if (access === null) return NextResponse.json({ error: "Birim bulunamadı." }, { status: 404 });
  if (!access) return NextResponse.json({ error: "Bu birime erişim yetkiniz yok." }, { status: 403 });

  await prisma.housingUnit.delete({ where: { id } });
  createAuditLog({ userId: session.user.id, action: ACTIONS.HOUSING_UNIT_DELETED, entity: "HousingUnit", entityId: id, description: "Barınma birimi silindi" }).catch(console.error);
  return NextResponse.json({ ok: true });
}
