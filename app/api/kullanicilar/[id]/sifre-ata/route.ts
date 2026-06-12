import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { parseJson, zPassword } from "@/lib/validation";

const sifreAtaSchema = z.object({ sifre: zPassword });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const r = await parseJson(req, sifreAtaSchema);
  if ("error" in r) return r.error;
  const { sifre } = r.data;

  const passwordHash = await bcrypt.hash(sifre, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.PASSWORD_SET,
    entity: "User",
    entityId: id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: "Kullanıcı şifresi admin tarafından atandı",
  });

  return NextResponse.json({ success: true });
}
