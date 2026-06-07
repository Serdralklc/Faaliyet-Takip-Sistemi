import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGonulluFromCookie } from "@/lib/gonullu-auth";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SISTEM_ADMIN", "GENEL_MERKEZ", "IL_SORUMLUSU", "BOLGE_SORUMLUSU"];

export async function GET() {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  // Gönüllü tablosunda ara
  const v = await prisma.volunteer.findUnique({
    where: { id: session.id },
    select: {
      id: true, adSoyad: true, telefon: true, email: true,
      ogrenim: true, ogrenimTuru: true, bolum: true, okul: true, il: true, createdAt: true,
    },
  });

  if (v) {
    return NextResponse.json({ ...v, role: "GONULLU", isAdmin: false });
  }

  // Staff tablosunda ara (yönetici gönüllü panelinden giriş yaptıysa)
  const u = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, ad: true, soyad: true, email: true, telefon: true, role: true },
  });

  if (u) {
    const isAdmin = ADMIN_ROLES.includes(u.role);
    return NextResponse.json({
      id:      u.id,
      adSoyad: `${u.ad} ${u.soyad}`,
      telefon: u.telefon ?? "",
      email:   u.email,
      role:    u.role,
      isAdmin,
    });
  }

  return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
}
