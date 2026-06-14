import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { sutunSchema } from "@/lib/veri-tablosu";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  baslik: z.string().trim().min(1).max(200).optional(),
  aciklama: z.string().trim().max(20000).optional(),
  durum: z.enum(["TASLAK", "YAYINDA", "KAPALI", "PASIF", "ARSIV"]).optional(),
  hedefBolge: z.boolean().optional(),
  hedefIl: z.boolean().optional(),
  sistemEgitim: z.boolean().optional(),
  sistemUniversite: z.boolean().optional(),
  sistemLise: z.boolean().optional(),
  /** Verilirse sütun seti tamamen değiştirilir — yalnızca kayıt yokken */
  sutunlar: z.array(sutunSchema).min(1).max(40).optional(),
});

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const tablo = await prisma.veriTablosu.findUnique({
    where: { id },
    include: { sutunlar: { orderBy: { sira: "asc" } }, _count: { select: { kayitlar: true } } },
  });
  if (!tablo) return NextResponse.json({ error: "Veri tablosu bulunamadı." }, { status: 404 });
  return NextResponse.json(tablo);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const r = await parseJson(req, patchSchema);
  if ("error" in r) return r.error;
  const { sutunlar, ...meta } = r.data;

  const mevcut = await prisma.veriTablosu.findUnique({
    where: { id },
    include: { _count: { select: { kayitlar: true } } },
  });
  if (!mevcut) return NextResponse.json({ error: "Veri tablosu bulunamadı." }, { status: 404 });

  if (sutunlar && mevcut._count.kayitlar > 0) {
    return NextResponse.json(
      { error: "Kayıt girilmiş bir tablonun sütunları değiştirilemez. Yeni bir tablo oluşturun." },
      { status: 400 }
    );
  }

  const tablo = await prisma.veriTablosu.update({
    where: { id },
    data: {
      ...meta,
      ...(sutunlar
        ? { sutunlar: { deleteMany: {}, create: sutunlar.map((s, i) => ({ ...s, sira: i })) } }
        : {}),
    },
    include: { sutunlar: { orderBy: { sira: "asc" } } },
  });
  return NextResponse.json(tablo);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const tablo = await prisma.veriTablosu.findUnique({ where: { id }, select: { id: true } });
  if (!tablo) return NextResponse.json({ error: "Veri tablosu bulunamadı." }, { status: 404 });

  await prisma.veriTablosu.delete({ where: { id } }); // sütunlar + kayıtlar cascade
  return NextResponse.json({ ok: true });
}
