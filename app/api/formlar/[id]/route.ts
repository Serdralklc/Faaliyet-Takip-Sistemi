import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { soruSchema } from "@/lib/form-yonetimi";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  baslik: z.string().trim().min(1).max(200).optional(),
  aciklama: z.string().trim().max(2000).optional(),
  durum: z.enum(["TASLAK", "YAYINDA", "KAPALI"]).optional(),
  hedefBolge: z.boolean().optional(),
  hedefIl: z.boolean().optional(),
  sistemEgitim: z.boolean().optional(),
  sistemUniversite: z.boolean().optional(),
  sistemLise: z.boolean().optional(),
  /** Verilirse soru seti tamamen değiştirilir — yalnızca yanıt yokken */
  sorular: z.array(soruSchema).min(1).max(60).optional(),
});

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const form = await prisma.dinamikForm.findUnique({
    where: { id },
    include: { sorular: { orderBy: { sira: "asc" } }, _count: { select: { yanitlar: true } } },
  });
  if (!form) return NextResponse.json({ error: "Form bulunamadı." }, { status: 404 });
  return NextResponse.json(form);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const r = await parseJson(req, patchSchema);
  if ("error" in r) return r.error;
  const { sorular, ...meta } = r.data;

  const mevcut = await prisma.dinamikForm.findUnique({
    where: { id },
    include: { _count: { select: { yanitlar: true } } },
  });
  if (!mevcut) return NextResponse.json({ error: "Form bulunamadı." }, { status: 404 });

  if (sorular && mevcut._count.yanitlar > 0) {
    return NextResponse.json(
      { error: "Yanıt alınmış bir formun soruları değiştirilemez. Yeni bir form oluşturun." },
      { status: 400 }
    );
  }

  const form = await prisma.dinamikForm.update({
    where: { id },
    data: {
      ...meta,
      ...(sorular
        ? { sorular: { deleteMany: {}, create: sorular.map((s, i) => ({ ...s, sira: i })) } }
        : {}),
    },
    include: { sorular: { orderBy: { sira: "asc" } } },
  });

  const action =
    meta.durum === "YAYINDA" ? ACTIONS.FORM_PUBLISHED :
    meta.durum === "KAPALI" ? ACTIONS.FORM_CLOSED : ACTIONS.FORM_UPDATED;
  createAuditLog({
    userId: session.user.id,
    action,
    entity: "DinamikForm",
    entityId: id,
    description: `Form ${meta.durum === "YAYINDA" ? "yayınlandı" : meta.durum === "KAPALI" ? "kapatıldı" : "güncellendi"}: ${form.baslik}`,
  }).catch(console.error);

  return NextResponse.json(form);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const form = await prisma.dinamikForm.findUnique({ where: { id }, select: { baslik: true } });
  if (!form) return NextResponse.json({ error: "Form bulunamadı." }, { status: 404 });

  await prisma.dinamikForm.delete({ where: { id } }); // sorular + yanıtlar cascade

  createAuditLog({
    userId: session.user.id,
    action: ACTIONS.FORM_DELETED,
    entity: "DinamikForm",
    entityId: id,
    description: `Form silindi: ${form.baslik}`,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
