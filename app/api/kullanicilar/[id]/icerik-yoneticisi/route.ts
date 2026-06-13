import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson } from "@/lib/validation";
import { icerikYoneticisiAtayabilir } from "@/lib/constants";

const bodySchema = z.object({ deger: z.boolean() });

// POST: bir Merkez Ekip kullanıcısına İçerik Yöneticisi ek rolünü ver / al
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!icerikYoneticisiAtayabilir(session.user.role)) {
    return NextResponse.json({ error: "İçerik Yöneticisi rolünü yalnızca Sistem Admini verebilir" }, { status: 403 });
  }

  const r = await parseJson(req, bodySchema);
  if ("error" in r) return r.error;
  const { deger } = r.data;

  const hedef = await prisma.user.findUnique({
    where: { id },
    select: { role: true, ad: true, soyad: true, icerikYoneticisi: true },
  });
  if (!hedef) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // İçerik Yöneticisi yalnızca Merkez Ekip (GENEL_MERKEZ) üyelerine verilir
  if (hedef.role !== "GENEL_MERKEZ") {
    return NextResponse.json(
      { error: "İçerik Yöneticisi yetkisi yalnızca Merkez Ekip üyelerine verilebilir" },
      { status: 400 },
    );
  }

  await prisma.user.update({ where: { id }, data: { icerikYoneticisi: deger } });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.ROLE_CHANGED,
    entity: "User",
    entityId: id,
    oldValue: { icerikYoneticisi: hedef.icerikYoneticisi },
    newValue: { icerikYoneticisi: deger },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `${hedef.ad} ${hedef.soyad} — İçerik Yöneticisi yetkisi ${deger ? "verildi" : "alındı"}`,
  });

  return NextResponse.json({ success: true });
}
