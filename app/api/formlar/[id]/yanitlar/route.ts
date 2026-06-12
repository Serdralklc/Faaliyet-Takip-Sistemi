import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** GET — form yanıtları (yönetici, sonuç ekranı) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const form = await prisma.dinamikForm.findUnique({
    where: { id },
    include: {
      sorular: { orderBy: { sira: "asc" } },
      yanitlar: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!form) return NextResponse.json({ error: "Form bulunamadı." }, { status: 404 });

  return NextResponse.json(form);
}
