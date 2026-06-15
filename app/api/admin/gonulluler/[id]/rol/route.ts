import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson } from "@/lib/validation";
import { SUPER_ADMIN_ROLLERI } from "@/lib/constants";

const bodySchema = z.object({
  serGencRol: z.enum(["UNIVERSITE", "LISE"]).nullable().optional(),
  barinma: z.boolean().optional(),
});

// PATCH: SerGenç üyesinin ana rolü (Üni/Lise) ve Barınma yan rolünü güncelle
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!SUPER_ADMIN_ROLLERI.includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const r = await parseJson(req, bodySchema);
  if ("error" in r) return r.error;
  const { serGencRol, barinma } = r.data;

  const data: Record<string, unknown> = {};
  if (serGencRol !== undefined) data.serGencRol = serGencRol;
  if (barinma !== undefined) data.barinma = barinma;
  if (!Object.keys(data).length) return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });

  const uye = await prisma.volunteer.update({ where: { id }, data, select: { id: true, adSoyad: true, serGencRol: true, barinma: true } });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.ROLE_CHANGED,
    entity: "Volunteer",
    entityId: id,
    newValue: data,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `SerGenç üyesi rol güncellendi: ${uye.adSoyad}`,
  }).catch(() => {});

  return NextResponse.json(uye);
}
