import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJson, zId, zYil } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { temizleHedefler, type GenclikSistem } from "@/lib/genclik-hedef";
import type { Sistem, Donem } from "@/app/generated/prisma/client";

const SISTEMLER = ["UNIVERSITE", "LISE"] as const;
const DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];

// Sistem kısıtlı yönetim rolleri yalnızca kendi sistemine hedef girer
const ROL_SISTEM: Record<string, GenclikSistem> = {
  TURKIYE_UNIVERSITE_SORUMLUSU: "UNIVERSITE",
  TURKIYE_LISE_SORUMLUSU:       "LISE",
};
const ADMIN_ROLLER = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];

// GET: ?sistem=&yil=&donem=&scope=bolge|il&bolgeId=
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sistem = searchParams.get("sistem");
  const yil = Number(searchParams.get("yil"));
  const donem = searchParams.get("donem") ?? "";
  const scope = searchParams.get("scope");
  const bolgeId = searchParams.get("bolgeId");

  if (!SISTEMLER.includes(sistem as never) || !Number.isInteger(yil)) {
    return NextResponse.json({ error: "Geçersiz parametre" }, { status: 400 });
  }
  const sis = sistem as Sistem;

  if (scope === "il") {
    const where: { sistem: Sistem; yil: number; donem?: Donem; il?: { bolgeId: string } } = { sistem: sis, yil };
    if (donem && DONEMLER.includes(donem)) where.donem = donem as Donem;
    if (bolgeId) where.il = { bolgeId };
    const hedefler = await prisma.genclikIlHedef.findMany({
      where,
      include: { il: { select: { id: true, ad: true, bolgeId: true } } },
    });
    return NextResponse.json(hedefler);
  }

  // scope=bolge (varsayılan)
  const where: { sistem: Sistem; yil: number; donem?: Donem } = { sistem: sis, yil };
  if (donem && DONEMLER.includes(donem)) where.donem = donem as Donem;
  const hedefler = await prisma.genclikBolgeHedef.findMany({
    where,
    include: { bolge: { select: { id: true, no: true, ad: true } } },
  });
  return NextResponse.json(hedefler);
}

const postSchema = z.object({
  scope:  z.enum(["bolge", "il"]),
  sistem: z.enum(SISTEMLER),
  id:     zId,           // bolgeId veya ilId
  yil:    zYil,
  donem:  z.enum(["DONEM_1", "DONEM_2", "YAZ_DONEMI"]),
  hedefler: z.record(z.string(), z.number()).default({}),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const r = await parseJson(req, postSchema);
  if ("error" in r) return r.error;
  const { scope, sistem, id, yil, donem, hedefler } = r.data;

  const { role } = session.user;

  // Sistem kısıtlı yönetim rolü yalnızca kendi sistemine yazar
  if (ROL_SISTEM[role] && ROL_SISTEM[role] !== sistem) {
    return NextResponse.json({ error: "Bu sisteme hedef giremezsiniz" }, { status: 403 });
  }

  const temiz = temizleHedefler(sistem, hedefler);

  if (scope === "bolge") {
    if (!ADMIN_ROLLER.includes(role)) {
      return NextResponse.json({ error: "Bölge hedefi yalnızca yönetim girebilir" }, { status: 403 });
    }
    const h = await prisma.genclikBolgeHedef.upsert({
      where: { sistem_bolgeId_yil_donem: { sistem, bolgeId: id, yil, donem } },
      create: { sistem, bolgeId: id, yil, donem, hedefler: temiz },
      update: { hedefler: temiz },
    });
    await createAuditLog({
      userId: session.user.id, action: ACTIONS.TARGET_UPDATED,
      entity: "GenclikBolgeHedef", entityId: h.id, newValue: temiz,
      description: `${sistem} ${yil} ${donem} bölge muradı güncellendi`,
    }).catch(() => {});
    return NextResponse.json(h);
  }

  // scope === "il"
  const ilAllowed = [...ADMIN_ROLLER, "BOLGE_SORUMLUSU"];
  if (!ilAllowed.includes(role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  // Bölge sorumlusu yalnızca kendi bölgesindeki ile + kendi sistemine yazar
  if (role === "BOLGE_SORUMLUSU") {
    if (session.user.sistem !== sistem) {
      return NextResponse.json({ error: "Bu sisteme hedef giremezsiniz" }, { status: 403 });
    }
    const il = await prisma.il.findUnique({ where: { id }, select: { bolgeId: true } });
    if (!il || il.bolgeId !== session.user.activeBolgeId) {
      return NextResponse.json({ error: "Bu il sizin bölgenizde değil" }, { status: 403 });
    }
  }
  const h = await prisma.genclikIlHedef.upsert({
    where: { sistem_ilId_yil_donem: { sistem, ilId: id, yil, donem } },
    create: { sistem, ilId: id, yil, donem, hedefler: temiz },
    update: { hedefler: temiz },
  });
  await createAuditLog({
    userId: session.user.id, action: ACTIONS.TARGET_UPDATED,
    entity: "GenclikIlHedef", entityId: h.id, newValue: temiz,
    description: `${sistem} ${yil} ${donem} il muradı güncellendi`,
  }).catch(() => {});
  return NextResponse.json(h);
}
