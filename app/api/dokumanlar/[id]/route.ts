import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson, zKisaMetin } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { canManageDocs } from "@/lib/dokuman-access";
import { deleteFile } from "@/lib/storage";

const patchSchema = z.object({
  ad: zKisaMetin.optional(),
  klasorId: z.string().nullable().optional(),
  erisimEgitim: z.boolean().optional(),
  erisimUniversite: z.boolean().optional(),
  erisimLise: z.boolean().optional(),
  erisimGonullu: z.boolean().optional(),
});

/** PATCH — yeniden adlandır / taşı / erişim güncelle (yalnızca yönetici) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  if (!canManageDocs(session.user)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const r = await parseJson(req, patchSchema);
  if ("error" in r) return r.error;

  const mevcut = await prisma.dokuman.findUnique({ where: { id }, select: { ad: true } });
  if (!mevcut) return NextResponse.json({ error: "Doküman bulunamadı." }, { status: 404 });

  if (r.data.klasorId) {
    const klasor = await prisma.dokumanKlasor.findUnique({ where: { id: r.data.klasorId }, select: { id: true } });
    if (!klasor) return NextResponse.json({ error: "Hedef klasör bulunamadı." }, { status: 404 });
  }

  const dokuman = await prisma.dokuman.update({
    where: { id },
    data: { ...r.data, klasorId: r.data.klasorId === undefined ? undefined : r.data.klasorId || null },
  });

  createAuditLog({
    userId: session.user.id,
    action: ACTIONS.DOC_UPDATED,
    entity: "Dokuman",
    entityId: id,
    description: `Doküman güncellendi: ${dokuman.ad}`,
  }).catch(console.error);

  return NextResponse.json(dokuman);
}

/** DELETE — depolamadan ve kayıttan sil (yalnızca yönetici) */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  if (!canManageDocs(session.user)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const dokuman = await prisma.dokuman.findUnique({ where: { id }, select: { ad: true, storageKey: true } });
  if (!dokuman) return NextResponse.json({ error: "Doküman bulunamadı." }, { status: 404 });

  await prisma.dokuman.delete({ where: { id } });
  await deleteFile(dokuman.storageKey);

  createAuditLog({
    userId: session.user.id,
    action: ACTIONS.DOC_DELETED,
    entity: "Dokuman",
    entityId: id,
    description: `Doküman silindi: ${dokuman.ad}`,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
