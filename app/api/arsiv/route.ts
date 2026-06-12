import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson, zYil } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { SUPER_ADMIN_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return !!role && SUPER_ADMIN_ROLLERI.includes(role as Role);
}

/** GET — yıl bazlı arşiv özeti: her yıl için kayıt/arşiv sayısı */
export async function GET() {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const gruplar = await prisma.activity.groupBy({
    by: ["yil", "arsivlendi"],
    _count: { _all: true },
  });

  const yilMap = new Map<number, { yil: number; toplam: number; arsivli: number }>();
  for (const g of gruplar) {
    const e = yilMap.get(g.yil) ?? { yil: g.yil, toplam: 0, arsivli: 0 };
    e.toplam += g._count._all;
    if (g.arsivlendi) e.arsivli += g._count._all;
    yilMap.set(g.yil, e);
  }

  const yillar = [...yilMap.values()].sort((a, b) => b.yil - a.yil);
  return NextResponse.json({ yillar });
}

const schema = z.object({
  yil: zYil,
  donem: z.enum(["DONEM_1", "DONEM_2", "YAZ_DONEMI"]).optional(),
  arsivle: z.boolean(),
});

/**
 * POST — bir yılı (veya yıl+dönemi) topluca arşivle / arşivden çıkar.
 * Arşivleme veriyi SİLMEZ; yalnızca salt-okunur bayrağı değiştirir.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const { yil, donem, arsivle } = r.data;

  const sonuc = await prisma.activity.updateMany({
    where: { yil, ...(donem ? { donem } : {}) },
    data: { arsivlendi: arsivle },
  });

  await createAuditLog({
    userId: session.user.id,
    action: arsivle ? ACTIONS.PERIOD_ARCHIVED : ACTIONS.PERIOD_UNARCHIVED,
    entity: "Activity",
    description: `${yil}${donem ? " " + donem : ""} dönemi ${arsivle ? "arşivlendi" : "arşivden çıkarıldı"} (${sonuc.count} kayıt)`,
  });

  return NextResponse.json({ ok: true, etkilenen: sonuc.count });
}
