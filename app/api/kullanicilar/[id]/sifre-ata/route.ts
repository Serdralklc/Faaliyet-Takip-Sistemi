import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { parseJson, zPassword } from "@/lib/validation";
import { sistemSorumlusu, sistemKapsamindaYonetebilir } from "@/lib/constants";

const sifreAtaSchema = z.object({ sifre: zPassword });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const tamYetki = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU"].includes(session.user.role);
  if (!tamYetki && !sistemSorumlusu(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  // Sistem sorumlusu yalnızca kendi sistemindeki saha kullanıcısına şifre atayabilir
  if (!tamYetki) {
    const hedef = await prisma.user.findUnique({ where: { id }, select: { role: true, sistem: true } });
    if (!hedef) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    if (!sistemKapsamindaYonetebilir(session.user.role, session.user.sistem, hedef.role, hedef.sistem)) {
      return NextResponse.json({ error: "Bu kullanıcı sizin sisteminize ait değil" }, { status: 403 });
    }
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
