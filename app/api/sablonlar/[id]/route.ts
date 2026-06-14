import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

/** GET — tek şablon (içeriğiyle; yeni form/tablo oluştururken yüklenir) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const sablon = await prisma.sablon.findUnique({ where: { id } });
  if (!sablon) return NextResponse.json({ error: "Şablon bulunamadı." }, { status: 404 });
  return NextResponse.json(sablon);
}

/** DELETE — şablonu sil */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const sablon = await prisma.sablon.findUnique({ where: { id }, select: { id: true } });
  if (!sablon) return NextResponse.json({ error: "Şablon bulunamadı." }, { status: 404 });

  await prisma.sablon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
