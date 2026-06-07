import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { setGonulluCookie } from "@/lib/gonullu-auth";

export const dynamic = "force-dynamic";

/**
 * Geçerli NextAuth (görevli) oturumu varsa gönüllü cookie'si oluşturur
 * ve gönüllü paneline yönlendirir.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    // Görevli oturumu yok → görevli giriş sayfasına yönlendir,
    // oradan döndükten sonra tekrar bu endpoint'e gel
    return NextResponse.redirect(
      new URL("/giris?redirect=/api/gonullu/staff-giris", process.env.NEXTAUTH_URL ?? "http://localhost:3000")
    );
  }

  const adSoyad = `${session.user.ad} ${session.user.soyad}`;

  await setGonulluCookie({
    id:      session.user.id,
    adSoyad,
    telefon: "",
    role:    session.user.role,
  });

  return NextResponse.redirect(
    new URL("/gonullu/panel", process.env.NEXTAUTH_URL ?? "http://localhost:3000")
  );
}
