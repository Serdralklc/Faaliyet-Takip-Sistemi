import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy (Next 16 — eski "middleware" konvansiyonu). Savunma derinliği katmanı:
 * /panel/* yönetici & saha panel sayfalarına, oturum çerezi olmadan erişen istekleri
 * /giris'e yönlendirir. Asıl yetki doğrulaması yine her sayfa/route'ta getSession ile
 * yapılır — bu yalnızca ilk savunma hattıdır (yeni bir sayfada kontrol unutulursa
 * en azından kimliksiz erişim engellenir).
 *
 * Kapsam dışı (bilinçli):
 *  - /api/*          → her route kendi getSession kontrolünü yapar
 *  - /gonullu/*      → ayrı gönüllü auth'u (lib/gonullu-auth) kullanır, NextAuth değil
 *  - public sayfalar → ana sayfa, /giris, davet vb.
 *
 * Yalnızca çerez VARLIĞINI kontrol eder (geçerliliğini değil); bu yüzden geçerli
 * kullanıcıları asla kilitlemez, geçersiz/expired token yine sayfa katmanında elenir.
 */
const SESSION_COOKIE = "next-auth.session-token";

export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has(SESSION_COOKIE) ||
    request.cookies.has(`__Secure-${SESSION_COOKIE}`);

  if (!hasSession) {
    const url = new URL("/giris", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
