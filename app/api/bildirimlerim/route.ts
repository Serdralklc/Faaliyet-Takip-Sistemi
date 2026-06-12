import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getGonulluFromCookie } from "@/lib/gonullu-auth";
import { parseJson, zId } from "@/lib/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** Oturum sahibini çöz: panel kullanıcısı veya gönüllü */
async function resolveOwner(): Promise<{ userId?: string; volunteerId?: string } | null> {
  const session = await getSession();
  if (session?.user) return { userId: session.user.id };
  const gonullu = await getGonulluFromCookie();
  if (gonullu) {
    // staff-giris ile gelen yöneticiler User tablosundadır
    return gonullu.role === "GONULLU" ? { volunteerId: gonullu.id } : { userId: gonullu.id };
  }
  return null;
}

/**
 * GET — bildirimlerim. ?sayac=1 → yalnızca okunmamış sayısı (çan rozeti).
 */
export async function GET(req: NextRequest) {
  const owner = await resolveOwner();
  if (!owner) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const where = owner.userId ? { userId: owner.userId } : { volunteerId: owner.volunteerId };

  if (req.nextUrl.searchParams.get("sayac") === "1") {
    const okunmamis = await prisma.bildirimAlim.count({ where: { ...where, goruldu: null } });
    return NextResponse.json({ okunmamis });
  }

  const alimlar = await prisma.bildirimAlim.findMany({
    where,
    orderBy: { bildirim: { createdAt: "desc" } },
    take: 30,
    include: { bildirim: { select: { baslik: true, mesaj: true, tip: true, link: true, createdAt: true } } },
  });

  const okunmamis = alimlar.filter(a => !a.goruldu).length;

  return NextResponse.json({
    okunmamis,
    bildirimler: alimlar.map(a => ({
      alimId: a.id,
      baslik: a.bildirim.baslik,
      mesaj: a.bildirim.mesaj,
      tip: a.bildirim.tip,
      link: a.bildirim.link,
      tarih: a.bildirim.createdAt,
      goruldu: !!a.goruldu,
    })),
  });
}

/** POST {alimId} — bildirimi görüldü işaretle (yalnızca sahibi) */
export async function POST(req: NextRequest) {
  const owner = await resolveOwner();
  if (!owner) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const r = await parseJson(req, z.object({ alimId: zId }));
  if ("error" in r) return r.error;

  const where = owner.userId ? { userId: owner.userId } : { volunteerId: owner.volunteerId };
  const sonuc = await prisma.bildirimAlim.updateMany({
    where: { id: r.data.alimId, ...where, goruldu: null },
    data: { goruldu: new Date() },
  });

  return NextResponse.json({ ok: true, guncellendi: sonuc.count });
}
