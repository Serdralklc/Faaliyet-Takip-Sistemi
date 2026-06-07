import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getGonulluFromCookie } from "@/lib/gonullu-auth";

export const dynamic = "force-dynamic";


export async function GET() {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const v = await prisma.volunteer.findUnique({
    where: { id: session.id },
    select: {
      id: true, adSoyad: true, telefon: true, email: true,
      ogrenim: true, ogrenimTuru: true, bolum: true, okul: true, il: true, createdAt: true,
    },
  });

  if (!v) return NextResponse.json({ error: "Gönüllü bulunamadı." }, { status: 404 });
  return NextResponse.json(v);
}
