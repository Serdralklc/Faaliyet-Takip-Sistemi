import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { BursBasvuruDurum } from "@/app/generated/prisma/client";
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
  const durum = searchParams.get("durum") || undefined;

  const where = durum ? { durum: durum as BursBasvuruDurum } : {};
  const pagination = readPagination(searchParams);

  if (!pagination.paged) {
    // Geriye uyumlu mod: page/limit yoksa düz dizi döner (sert tavanla).
    const list = await prisma.bursBasvuru.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pagination.take,
      include: {
        volunteer: { select: { adSoyad: true, telefon: true, email: true } },
      },
    });
    return NextResponse.json(list);
  }

  const [items, total] = await Promise.all([
    prisma.bursBasvuru.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: {
        volunteer: { select: { adSoyad: true, telefon: true, email: true } },
      },
    }),
    prisma.bursBasvuru.count({ where }),
  ]);

  return NextResponse.json({ items, total, page: pagination.page, limit: pagination.limit });
}

const patchSchema = z.object({
  id: zId,
  durum: z.enum(["BEKLEMEDE", "INCELENIYOR", "ONAYLANDI", "REDDEDILDI"]).optional(),
  yoneticiNotu: z.string().trim().max(2000).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const r = await parseJson(req, patchSchema);
  if ("error" in r) return r.error;
  const { id, durum, yoneticiNotu } = r.data;

  const eski = await prisma.bursBasvuru.findUnique({ where: { id }, select: { durum: true } });
  if (!eski) return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 });

  const updated = await prisma.bursBasvuru.update({
    where: { id },
    data: { durum, yoneticiNotu: yoneticiNotu ?? undefined },
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.BURS_STATUS_CHANGED,
    entity: "BursBasvuru",
    entityId: id,
    oldValue: { durum: eski.durum },
    newValue: { durum: updated.durum },
    description: `Burs başvurusu durumu güncellendi: ${eski.durum} → ${updated.durum}`,
  }).catch(console.error);

  return NextResponse.json({ ok: true, updated });
}
