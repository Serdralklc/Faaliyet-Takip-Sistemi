import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson } from "@/lib/validation";
import { talepKarsilayanMi, TALEP_DURUMLAR, TALEP_DURUM_LABEL } from "@/lib/istisare";
import type { TalepBirim, TalepDurum } from "@/lib/istisare";
import type { TalepDurum as PDurum } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ durum: z.enum(TALEP_DURUMLAR as [TalepDurum, ...TalepDurum[]]) });

// POST: talep durumunu değiştir (karşılayan taraf; oluşturan yalnızca kapatabilir)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id: userId, role } = session.user;

  const talep = await prisma.talep.findUnique({ where: { id }, select: { olusturanId: true, birim: true, durum: true } });
  if (!talep) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });

  const r = await parseJson(req, bodySchema);
  if ("error" in r) return r.error;
  const { durum } = r.data;

  const karsilayanMi = talepKarsilayanMi(talep.birim as TalepBirim, role);
  const olusturanMi = talep.olusturanId === userId;
  // Karşılayan her duruma; oluşturan yalnızca KAPATILDI'ya çekebilir
  if (!karsilayanMi && !(olusturanMi && durum === "KAPATILDI")) {
    return NextResponse.json({ error: "Bu durumu değiştirme yetkiniz yok" }, { status: 403 });
  }

  await prisma.talep.update({ where: { id }, data: { durum: durum as PDurum } });

  await createAuditLog({
    userId, action: ACTIONS.TALEP_STATUS_CHANGED, entity: "Talep", entityId: id,
    oldValue: { durum: talep.durum }, newValue: { durum },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `İstişare talebi durumu: ${TALEP_DURUM_LABEL[durum]}`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
