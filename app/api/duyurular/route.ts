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

/** GET — tüm duyurular (yönetici; aktif/pasif/süresi dolmuş dahil) */
export async function GET() {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const duyurular = await prisma.duyuru.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json(duyurular);
}

const schema = z
  .object({
    metin: zUzunMetin,
    link: z.string().trim().max(500).optional(),
    baslangic: z.coerce.date(),
    bitis: z.coerce.date(),
    aktif: z.boolean().optional().default(true),
  })
  .refine(d => d.bitis > d.baslangic, { message: "Bitiş tarihi başlangıçtan sonra olmalı.", path: ["bitis"] });

/** POST — yeni duyuru oluştur (yönetici) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const d = r.data;

  const duyuru = await prisma.duyuru.create({
    data: {
      metin: d.metin,
      link: d.link || null,
      baslangic: d.baslangic,
      bitis: d.bitis,
      aktif: d.aktif,
      createdById: session.user.id,
      createdByName: `${session.user.ad} ${session.user.soyad}`,
    },
  });

  createAuditLog({
    userId: session.user.id,
    action: "DUYURU_OLUSTURULDU",
    entity: "Duyuru",
    entityId: duyuru.id,
    description: `Duyuru oluşturuldu: ${d.metin.slice(0, 80)}`,
  }).catch(console.error);

  return NextResponse.json(duyuru, { status: 201 });
}
