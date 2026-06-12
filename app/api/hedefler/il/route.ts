import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { parseJson, zId, zYil, zPozitifSayi } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";

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

const postSchema = z.object({
  ilId: zId,
  bolgeHedefId: zId,
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
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "BOLGE_SORUMLUSU"];
  if (!allowed.includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const r = await parseJson(req, postSchema);
  if ("error" in r) return r.error;
  const { ilId, bolgeHedefId, yil, donem, ...hedefler } = r.data;

  const hedef = await prisma.ilHedef.upsert({
    where: { ilId_yil_donem: { ilId, yil, donem } },
    create: { ilId, bolgeHedefId, yil, donem, ...hedefler },
    update: { ...hedefler, bolgeHedefId },
    include: { il: { select: { id: true, ad: true } } },
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.TARGET_UPDATED,
    entity: "IlHedef",
    entityId: hedef.id,
    newValue: hedefler,
    description: `${yil} ${donem} il hedefi güncellendi`,
  }).catch(console.error);

  return NextResponse.json(hedef);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "BOLGE_SORUMLUSU"];
  if (!allowed.includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.ilHedef.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
