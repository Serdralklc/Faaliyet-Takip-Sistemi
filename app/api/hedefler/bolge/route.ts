import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { parseJson, zId, zYil, zPozitifSayi } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { YONETICI_ROLLERI } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bolgeId = searchParams.get("bolgeId");
  const yil = searchParams.get("yil");
  const donem = searchParams.get("donem");

  const where: Record<string, unknown> = {};
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

const postSchema = z.object({
  bolgeId: zId,
  yil: zYil,
  donem: z.enum(["DONEM_1", "DONEM_2", "YAZ_DONEMI"]),
  yeniIntisap: zPozitifSayi.optional(),
  sosyalFaaliyet: zPozitifSayi.optional(),
  kafile: zPozitifSayi.optional(),
  sabahNamazi: zPozitifSayi.optional(),
  ilimDersi: zPozitifSayi.optional(),
  kykBulusma: zPozitifSayi.optional(),
  ziyaret: zPozitifSayi.optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const r = await parseJson(req, postSchema);
  if ("error" in r) return r.error;
  const { bolgeId, yil, donem, ...hedefler } = r.data;

  const hedef = await prisma.bolgeHedef.upsert({
    where: { bolgeId_yil_donem: { bolgeId, yil, donem } },
    create: { bolgeId, yil, donem, ...hedefler },
    update: hedefler,
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.TARGET_UPDATED,
    entity: "BolgeHedef",
    entityId: hedef.id,
    newValue: hedefler,
    description: `${yil} ${donem} bölge hedefi güncellendi`,
  }).catch(console.error);

  return NextResponse.json(hedef);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.bolgeHedef.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
