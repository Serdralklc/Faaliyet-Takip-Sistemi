import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getGonulluFromCookie } from "@/lib/gonullu-auth";
import { erisimAlani } from "@/lib/dokuman-access";
import { readLocalFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Erişim kontrollü dosya servisi.
 * Sıra: paylaşım token'ı → yönetici/panel oturumu (sistem bayrağı) → gönüllü cookie.
 * Blob'da saklanan dosyalar için doğrudan blob URL'ine yönlendirir;
 * yerel sürücüde (geliştirme) dosyayı diskten okuyup döndürür.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dokuman = await prisma.dokuman.findUnique({ where: { id } });
  if (!dokuman) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });

  let izinli = false;

  // 1) Paylaşım token'ı (üyeliksiz erişim)
  const token = req.nextUrl.searchParams.get("token");
  if (token) {
    const paylasim = await prisma.dokumanPaylasim.findUnique({ where: { token } });
    if (
      paylasim &&
      (!paylasim.expiresAt || paylasim.expiresAt >= new Date()) &&
      (paylasim.dokumanId === id || (paylasim.klasorId && paylasim.klasorId === dokuman.klasorId))
    ) {
      izinli = true;
    }
  }

  // 2) Yönetici / panel oturumu
  if (!izinli) {
    const session = await getSession();
    if (session?.user) {
      const alan = erisimAlani(session.user);
      if (alan === null) izinli = true;
      else if (alan !== "YOK" && dokuman[alan]) izinli = true;
    }
  }

  // 3) Gönüllü oturumu
  if (!izinli && dokuman.erisimGonullu) {
    const gonullu = await getGonulluFromCookie();
    if (gonullu) izinli = true;
  }

  if (!izinli) return NextResponse.json({ error: "Bu dosyaya erişim yetkiniz yok." }, { status: 403 });

  // Blob: doğrudan yönlendir
  if (!dokuman.storageKey.startsWith("local:")) {
    return NextResponse.redirect(dokuman.url);
  }

  // Yerel sürücü: diskten oku
  const buffer = await readLocalFile(dokuman.storageKey);
  if (!buffer) return NextResponse.json({ error: "Dosya depolamada bulunamadı." }, { status: 404 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": dokuman.mimeTipi,
      "Content-Length": String(dokuman.boyut),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(dokuman.ad)}`,
    },
  });
}
