import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson, zKisaMetin } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { canManageDocs } from "@/lib/dokuman-access";

const patchSchema = z.object({
  ad: zKisaMetin.optional(),
  parentId: z.string().nullable().optional(),
  erisimEgitim: z.boolean().optional(),
  erisimUniversite: z.boolean().optional(),
  erisimLise: z.boolean().optional(),
  erisimGonullu: z.boolean().optional(),
});

/** PATCH — klasör yeniden adlandır / taşı / erişim (yalnızca yönetici) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  if (!canManageDocs(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const r = await parseJson(req, patchSchema);
  if ("error" in r) return r.error;

  if (r.data.parentId === id) {
    return NextResponse.json({ error: "Klasör kendi içine taşınamaz." }, { status: 400 });
  }
  if (r.data.parentId) {
    // Döngü kontrolü: hedef, taşınan klasörün alt ağacında olamaz
    let cursor: string | null = r.data.parentId;
    while (cursor) {
      if (cursor === id) return NextResponse.json({ error: "Klasör kendi alt klasörüne taşınamaz." }, { status: 400 });
      const k: { parentId: string | null } | null = await prisma.dokumanKlasor.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = k?.parentId ?? null;
    }
  }

  const klasor = await prisma.dokumanKlasor.update({
    where: { id },
    data: { ...r.data, parentId: r.data.parentId === undefined ? undefined : r.data.parentId || null },
  });

  createAuditLog({
    userId: session.user.id,
    action: ACTIONS.DOC_FOLDER_UPDATED,
    entity: "DokumanKlasor",
    entityId: id,
    description: `Klasör güncellendi: ${klasor.ad}`,
  }).catch(console.error);

  return NextResponse.json(klasor);
}

/** DELETE — yalnızca boş klasör silinebilir (yanlışlıkla toplu silmeyi önler) */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  if (!canManageDocs(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const klasor = await prisma.dokumanKlasor.findUnique({
    where: { id },
    select: { ad: true, _count: { select: { children: true, dokumanlar: true } } },
  });
  if (!klasor) return NextResponse.json({ error: "Klasör bulunamadı." }, { status: 404 });
  if (klasor._count.children > 0 || klasor._count.dokumanlar > 0) {
    return NextResponse.json(
      { error: "Klasör boş değil. Önce içindeki dosya ve klasörleri silin veya taşıyın." },
      { status: 400 }
    );
  }

  await prisma.dokumanKlasor.delete({ where: { id } });

  createAuditLog({
    userId: session.user.id,
    action: ACTIONS.DOC_FOLDER_DELETED,
    entity: "DokumanKlasor",
    entityId: id,
    description: `Klasör silindi: ${klasor.ad}`,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
