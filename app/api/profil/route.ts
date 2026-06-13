import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: oturum açan kullanıcının kendi profil bilgileri (telefon dahil)
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ad: true, soyad: true, email: true, telefon: true, role: true, sistem: true },
  });
  if (!u) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  return NextResponse.json(u);
}
