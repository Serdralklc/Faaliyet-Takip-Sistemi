import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson, zKisaMetin } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { canManageDocs, erisimAlani } from "@/lib/dokuman-access";

export const dynamic = "force-dynamic";

/**
 * GET ?klasorId= — klasör içeriği (alt klasörler + dosyalar + breadcrumb).
 * Yönetici tümünü, panel kullanıcıları yalnızca kendi sistem bayrağı açık öğeleri görür.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const alan = erisimAlani(session.user);
  if (alan === "YOK") return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const klasorId = req.nextUrl.searchParams.get("klasorId") || null;
  const flagFilter = alan ? { [alan]: true } : {};

  const [klasorlar, dosyalar] = await Promise.all([
    prisma.dokumanKlasor.findMany({
      where: { parentId: klasorId, ...flagFilter },
      orderBy: { ad: "asc" },
      include: { _count: { select: { children: true, dokumanlar: true } } },
    }),
    prisma.dokuman.findMany({
      where: { klasorId, ...flagFilter },
      orderBy: { ad: "asc" },
    }),
  ]);

  // Breadcrumb (kök → mevcut)
  const breadcrumb: { id: string; ad: string }[] = [];
  let cursor = klasorId;
  while (cursor) {
    const k = await prisma.dokumanKlasor.findUnique({ where: { id: cursor }, select: { id: true, ad: true, parentId: true } });
    if (!k) break;
    breadcrumb.unshift({ id: k.id, ad: k.ad });
    cursor = k.parentId;
  }

  return NextResponse.json({ klasorlar, dosyalar, breadcrumb, yonetici: canManageDocs(session.user) });
}

const klasorSchema = z.object({
  ad: zKisaMetin,
  parentId: z.string().nullable().optional(),
  erisimEgitim: z.boolean().optional(),
  erisimUniversite: z.boolean().optional(),
  erisimLise: z.boolean().optional(),
  erisimGonullu: z.boolean().optional(),
});

/** POST — yeni klasör (yalnızca yönetici) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  if (!canManageDocs(session.user)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const r = await parseJson(req, klasorSchema);
  if ("error" in r) return r.error;

  const klasor = await prisma.dokumanKlasor.create({
    data: { ...r.data, parentId: r.data.parentId || null, createdById: session.user.id },
  });

  createAuditLog({
    userId: session.user.id,
    action: ACTIONS.DOC_FOLDER_CREATED,
    entity: "DokumanKlasor",
    entityId: klasor.id,
    description: `Klasör oluşturuldu: ${klasor.ad}`,
  }).catch(console.error);

  return NextResponse.json(klasor, { status: 201 });
}
