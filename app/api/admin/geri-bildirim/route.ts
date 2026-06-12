import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { GeriBildirimDurum, GeriBildirimKonu } from "@/app/generated/prisma/client";
import { z } from "zod";
import { parseJson, readPagination, zId } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";


function isAdmin(session: { user?: { role?: string } } | null) {
  return ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU"].includes(session?.user?.role ?? "");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const durum = searchParams.get("durum") as GeriBildirimDurum | null;
  const konu  = searchParams.get("konu")  as GeriBildirimKonu  | null;

  const where = {
    ...(durum ? { durum } : {}),
    ...(konu  ? { konu  } : {}),
  };
  const pagination = readPagination(searchParams);

  if (!pagination.paged) {
    // Geriye uyumlu mod: page/limit yoksa düz dizi döner (sert tavanla).
    const list = await prisma.geriBildirim.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pagination.take,
      include: {
        volunteer: { select: { adSoyad: true, telefon: true } },
      },
    });
    return NextResponse.json(list);
  }

  const [items, total] = await Promise.all([
    prisma.geriBildirim.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: {
        volunteer: { select: { adSoyad: true, telefon: true } },
      },
    }),
    prisma.geriBildirim.count({ where }),
  ]);

  return NextResponse.json({ items, total, page: pagination.page, limit: pagination.limit });
}

const patchSchema = z.object({
  id: zId,
  durum: z.enum(["YENI", "INCELENIYOR", "COZULDU", "KAPATILDI"]),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const r = await parseJson(req, patchSchema);
  if ("error" in r) return r.error;
  const { id, durum } = r.data;

  const eski = await prisma.geriBildirim.findUnique({ where: { id }, select: { durum: true } });
  if (!eski) return NextResponse.json({ error: "Geri bildirim bulunamadı." }, { status: 404 });

  await prisma.geriBildirim.update({ where: { id }, data: { durum } });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.FEEDBACK_STATUS_CHANGED,
    entity: "GeriBildirim",
    entityId: id,
    oldValue: { durum: eski.durum },
    newValue: { durum },
    description: `Geri bildirim durumu güncellendi: ${eski.durum} → ${durum}`,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
