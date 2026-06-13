import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson, zUzunMetin } from "@/lib/validation";
import { createAuditLog } from "@/lib/audit";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

const patchSchema = z
  .object({
    metin: zUzunMetin.optional(),
    link: z.string().trim().max(500).nullable().optional(),
    baslangic: z.coerce.date().optional(),
    bitis: z.coerce.date().optional(),
    aktif: z.boolean().optional(),
  })
  .refine(d => !(d.baslangic && d.bitis) || d.bitis > d.baslangic, {
    message: "Bitiş tarihi başlangıçtan sonra olmalı.",
    path: ["bitis"],
  });

/** PATCH — duyuru güncelle / aktif-pasif (yönetici) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const r = await parseJson(req, patchSchema);
  if ("error" in r) return r.error;

  const mevcut = await prisma.duyuru.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return NextResponse.json({ error: "Duyuru bulunamadı." }, { status: 404 });

  const duyuru = await prisma.duyuru.update({
    where: { id },
    data: {
      ...r.data,
      link: r.data.link === undefined ? undefined : r.data.link || null,
    },
  });

  createAuditLog({
    userId: session.user.id,
    action: "DUYURU_GUNCELLENDI",
    entity: "Duyuru",
    entityId: id,
    description: `Duyuru güncellendi${r.data.aktif !== undefined ? ` (aktif: ${r.data.aktif})` : ""}`,
  }).catch(console.error);

  return NextResponse.json(duyuru);
}

/** DELETE — duyuru sil (yönetici) */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const mevcut = await prisma.duyuru.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return NextResponse.json({ error: "Duyuru bulunamadı." }, { status: 404 });

  await prisma.duyuru.delete({ where: { id } });

  createAuditLog({
    userId: session.user.id,
    action: "DUYURU_SILINDI",
    entity: "Duyuru",
    entityId: id,
    description: "Duyuru silindi",
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
