import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessIl, canAccessHousingUnit } from "@/lib/housing-access";
import { createAuditLog, ACTIONS } from "@/lib/audit";

/** Öğrencinin bağlı olduğu birimin iline erişim kontrolü; öğrenci yoksa null */
async function canAccessStudent(user: { role: string; activeIlId?: string | null; activeBolgeId?: string | null }, studentId: string) {
  const student = await prisma.housingStudent.findUnique({
    where: { id: studentId },
    select: { housingUnit: { select: { ilId: true } } },
  });
  if (!student) return null;
  return canAccessIl(user, student.housingUnit.ilId);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { housingUnitId, adSoyad, bolum, sinif, bursMu, disiplinSayisi, iliskiKesme, notlar } = body;

  if (!housingUnitId || !adSoyad) return NextResponse.json({ error: "Eksik alan" }, { status: 400 });

  const access = await canAccessHousingUnit(session.user, housingUnitId);
  if (access === null) return NextResponse.json({ error: "Birim bulunamadı." }, { status: 404 });
  if (!access) return NextResponse.json({ error: "Bu birime erişim yetkiniz yok." }, { status: 403 });

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
  createAuditLog({ userId: session.user.id, action: ACTIONS.HOUSING_STUDENT_SAVED, entity: "HousingStudent", entityId: student.id, newValue: { adSoyad }, description: `Öğrenci eklendi: ${adSoyad}` }).catch(console.error);
  return NextResponse.json(student);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { id, adSoyad, bolum, sinif, bursMu, disiplinSayisi, iliskiKesme, notlar } = body;
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const access = await canAccessStudent(session.user, id);
  if (access === null) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  if (!access) return NextResponse.json({ error: "Bu kayda erişim yetkiniz yok." }, { status: 403 });

  const student = await prisma.housingStudent.update({
    where: { id },
    data: { adSoyad, bolum, sinif, bursMu, disiplinSayisi, iliskiKesme, notlar },
  });
  createAuditLog({ userId: session.user.id, action: ACTIONS.HOUSING_STUDENT_SAVED, entity: "HousingStudent", entityId: id, newValue: { adSoyad }, description: `Öğrenci güncellendi: ${adSoyad ?? id}` }).catch(console.error);
  return NextResponse.json(student);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const access = await canAccessStudent(session.user, id);
  if (access === null) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  if (!access) return NextResponse.json({ error: "Bu kayda erişim yetkiniz yok." }, { status: 403 });

  await prisma.housingStudent.delete({ where: { id } });
  createAuditLog({ userId: session.user.id, action: ACTIONS.HOUSING_STUDENT_DELETED, entity: "HousingStudent", entityId: id, description: "Barınma öğrenci kaydı silindi" }).catch(console.error);
  return NextResponse.json({ ok: true });
}
