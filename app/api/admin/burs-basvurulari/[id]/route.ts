import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { parseJson } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";

const patchSchema = z.object({
  durum: z.enum(["BEKLEMEDE", "INCELENIYOR", "ONAYLANDI", "REDDEDILDI"]).optional(),
  yoneticiNotu: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const r = await parseJson(req, patchSchema);
  if ("error" in r) return r.error;
  const { durum, yoneticiNotu } = r.data;

  const eski = await prisma.bursBasvuru.findUnique({ where: { id }, select: { durum: true } });
  if (!eski) return NextResponse.json({ error: "Başvuru bulunamadı" }, { status: 404 });

  const updated = await prisma.bursBasvuru.update({
    where: { id },
    data: {
      durum,
      yoneticiNotu: yoneticiNotu || null,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.BURS_STATUS_CHANGED,
    entity: "BursBasvuru",
    entityId: id,
    oldValue: { durum: eski.durum },
    newValue: { durum: updated.durum },
    description: `Burs başvurusu durumu güncellendi: ${eski.durum} → ${updated.durum}`,
  }).catch(console.error);

  return NextResponse.json({ success: true, durum: updated.durum });
}
