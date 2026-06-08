import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bolgeId = searchParams.get("bolgeId");
  const yil = searchParams.get("yil");
  const donem = searchParams.get("donem");

  const where: any = {};
  if (bolgeId) where.bolgeId = bolgeId;
  if (yil) where.yil = parseInt(yil);
  if (donem) where.donem = donem;

  const hedefler = await prisma.bolgeHedef.findMany({
    where,
    include: {
      bolge: { select: { id: true, no: true, ad: true } },
      ilHedef: { include: { il: { select: { id: true, ad: true } } } },
    },
    orderBy: [{ yil: "desc" }, { donem: "asc" }],
  });

  return NextResponse.json(hedefler);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { bolgeId, yil, donem, ...hedefler } = body;

  if (!bolgeId || !yil || !donem)
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });

  const hedef = await prisma.bolgeHedef.upsert({
    where: { bolgeId_yil_donem: { bolgeId, yil: parseInt(yil), donem } },
    create: { bolgeId, yil: parseInt(yil), donem, ...hedefler },
    update: hedefler,
  });

  return NextResponse.json(hedef);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.bolgeHedef.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
