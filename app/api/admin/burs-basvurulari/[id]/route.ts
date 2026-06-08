import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { durum, yoneticiNotu } = await req.json();

  const updated = await prisma.bursBasvuru.update({
    where: { id },
    data: {
      durum,
      yoneticiNotu: yoneticiNotu || null,
    },
  });

  return NextResponse.json({ success: true, durum: updated.durum });
}
