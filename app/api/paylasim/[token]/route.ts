import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET — paylaşım linki içeriği (ÜYELİKSİZ erişim, tasarım gereği).
 * Klasör paylaşımı: klasörün doğrudan dosyaları; dosya paylaşımı: tek dosya.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 16) return NextResponse.json({ error: "Geçersiz bağlantı." }, { status: 404 });

  const paylasim = await prisma.dokumanPaylasim.findUnique({
    where: { token },
    include: {
      klasor: { include: { dokumanlar: { orderBy: { ad: "asc" } } } },
      dokuman: true,
    },
  });

  if (!paylasim) return NextResponse.json({ error: "Bağlantı bulunamadı veya kaldırılmış." }, { status: 404 });
  if (paylasim.expiresAt && paylasim.expiresAt < new Date()) {
    return NextResponse.json({ error: "Bu paylaşım bağlantısının süresi dolmuş." }, { status: 410 });
  }

  const dosyaJson = (d: { id: string; ad: string; boyut: number; uzanti: string; url: string; createdAt: Date }) => ({
    id: d.id,
    ad: d.ad,
    boyut: d.boyut,
    uzanti: d.uzanti,
    // Yerel sürücüde indirme token'la yetkilendirilir
    url: d.url.startsWith("/api/dosya/") ? `${d.url}?token=${token}` : d.url,
    createdAt: d.createdAt,
  });

  if (paylasim.dokuman) {
    return NextResponse.json({ tip: "dosya", dosya: dosyaJson(paylasim.dokuman) });
  }
  if (paylasim.klasor) {
    return NextResponse.json({
      tip: "klasor",
      ad: paylasim.klasor.ad,
      dosyalar: paylasim.klasor.dokumanlar.map(dosyaJson),
    });
  }
  return NextResponse.json({ error: "Paylaşım hedefi silinmiş." }, { status: 404 });
}
