import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson } from "@/lib/validation";
import { icerikYoneticisiAtayabilir } from "@/lib/constants";

const MERKEZ_TIER = ["GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "TEKNIK"];

const bodySchema = z.object({
  yanRol: z.enum(["ICERIK", "TEKNIK"]),
  deger: z.boolean(),
});

// POST: yan rol (İçerik Yöneticisi / Teknik) ver/al — yalnızca Sistem Admini
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!icerikYoneticisiAtayabilir(session.user.role)) {
    return NextResponse.json({ error: "Yan rolleri yalnızca Sistem Admini verebilir" }, { status: 403 });
  }

  const r = await parseJson(req, bodySchema);
  if ("error" in r) return r.error;
  const { yanRol, deger } = r.data;

  const kullanici = await prisma.user.findUnique({
    where: { id },
    select: { role: true, ad: true, soyad: true, icerikYoneticisi: true, teknikYetkisi: true },
  });
  if (!kullanici) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  if (!MERKEZ_TIER.includes(kullanici.role)) {
    return NextResponse.json({ error: "Yan rol yalnızca yönetim (merkez) kullanıcılarına verilir" }, { status: 400 });
  }

  const data = yanRol === "ICERIK" ? { icerikYoneticisi: deger } : { teknikYetkisi: deger };
  await prisma.user.update({ where: { id }, data });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.ROLE_CHANGED,
    entity: "User",
    entityId: id,
    newValue: data,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `${kullanici.ad} ${kullanici.soyad} — ${yanRol === "ICERIK" ? "İçerik Yöneticisi" : "Teknik"} yan rolü ${deger ? "verildi" : "alındı"}`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
