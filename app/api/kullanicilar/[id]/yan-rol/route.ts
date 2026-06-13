import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson } from "@/lib/validation";
import { icerikYoneticisiAtayabilir, YAN_ROLLER, YAN_ROL_LABEL } from "@/lib/constants";
import { syncRolCompat } from "@/lib/rol-sync";

const MERKEZ_TIER = ["GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "TEKNIK"];

const bodySchema = z.object({
  yanRol: z.enum(YAN_ROLLER.map(y => y.kod) as [string, ...string[]]),
  deger: z.boolean(),
});

// POST: bir yönetim kullanıcısına yan rol ver/al (çoklu) — yalnızca Sistem Admini.
// UserYanRol join'i güncellenir; eski icerikYoneticisi/teknikYetkisi/merkezGorev
// alanları syncRolCompat uyum köprüsü ile senkronlanır.
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
    select: { role: true, ad: true, soyad: true },
  });
  if (!kullanici) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  if (!MERKEZ_TIER.includes(kullanici.role)) {
    return NextResponse.json({ error: "Yan rol yalnızca yönetim kullanıcılarına verilir" }, { status: 400 });
  }

  const yrl = await prisma.yanRol.findUnique({ where: { kod: yanRol }, select: { id: true } });
  if (!yrl) return NextResponse.json({ error: "Geçersiz yan rol" }, { status: 400 });

  if (deger) {
    await prisma.userYanRol.upsert({
      where: { userId_yanRolId: { userId: id, yanRolId: yrl.id } },
      update: {},
      create: { userId: id, yanRolId: yrl.id },
    });
  } else {
    await prisma.userYanRol.deleteMany({ where: { userId: id, yanRolId: yrl.id } });
  }
  await syncRolCompat(id); // icerikYoneticisi/teknikYetkisi/merkezGorev senkron

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.ROLE_CHANGED,
    entity: "User",
    entityId: id,
    newValue: { yanRol, deger },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `${kullanici.ad} ${kullanici.soyad} — ${YAN_ROL_LABEL[yanRol]} yan rolü ${deger ? "verildi" : "alındı"}`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
