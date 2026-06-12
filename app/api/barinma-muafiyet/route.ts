import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

/** İlin barınma muafiyeti (ilimizde ev/apart/yurt yoktur) — il-bazlı kalıcı bayrak */

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const ilId = new URL(req.url).searchParams.get("ilId");
  if (!ilId) return NextResponse.json({ error: "ilId gerekli" }, { status: 400 });

  // İl sorumlusu yalnızca kendi ilini sorgular
  if (session.user.role === "IL_SORUMLUSU" && session.user.activeIlId !== ilId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const il = await prisma.il.findUnique({ where: { id: ilId }, select: { barinmaYok: true } });
  return NextResponse.json({ barinmaYok: il?.barinmaYok ?? false });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!["IL_SORUMLUSU", "SISTEM_ADMIN", "GENEL_MERKEZ"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = await req.json();
  const ilId: string | undefined = body?.ilId;
  const barinmaYok = !!body?.barinmaYok;
  if (!ilId) return NextResponse.json({ error: "ilId gerekli" }, { status: 400 });

  // İl sorumlusu yalnızca kendi ilini günceller
  if (session.user.role === "IL_SORUMLUSU" && session.user.activeIlId !== ilId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const il = await prisma.il.update({
    where: { id: ilId },
    data: { barinmaYok },
    select: { id: true, barinmaYok: true },
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.HOUSING_EXEMPTION_CHANGED,
    entity: "Il",
    entityId: il.id,
    description: `Barınma muafiyeti ${barinmaYok ? "açıldı" : "kapatıldı"}`,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ barinmaYok: il.barinmaYok });
}
