import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ilId = searchParams.get("ilId");
  const bolgeHedefId = searchParams.get("bolgeHedefId");

  const where: any = {};
  if (ilId) where.ilId = ilId;
  if (bolgeHedefId) where.bolgeHedefId = bolgeHedefId;

  const hedefler = await prisma.ilHedef.findMany({
    where,
    include: { il: { select: { id: true, ad: true } } },
  });

  return NextResponse.json(hedefler);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU", "BOLGE_SORUMLUSU"];
  if (!allowed.includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { ilId, bolgeHedefId, yil, donem, ...hedefler } = body;

  if (!ilId || !bolgeHedefId || !yil || !donem)
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });

  const hedef = await prisma.ilHedef.upsert({
    where: { ilId_yil_donem: { ilId, yil: parseInt(yil), donem } },
    create: { ilId, bolgeHedefId, yil: parseInt(yil), donem, ...hedefler },
    update: { ...hedefler, bolgeHedefId },
    include: { il: { select: { id: true, ad: true } } },
  });

  return NextResponse.json(hedef);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU", "BOLGE_SORUMLUSU"];
  if (!allowed.includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.ilHedef.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
