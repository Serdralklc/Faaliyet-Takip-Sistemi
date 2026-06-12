import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

const schema = z.object({
  durum: z.enum(["BEKLEMEDE", "INCELENIYOR", "GORUSULDU", "ONAYLANDI", "REDDEDILDI"]).optional(),
  yoneticiNotu: z.string().trim().max(2000).optional(),
});

/** Başvuru bu kullanıcının görüş alanında mı? (liste API'siyle aynı kural) */
async function canSee(
  user: { role: string; activeIlAd?: string | null; activeBolgeId?: string | null; activeBolgeAd?: string | null },
  basvuru: { gidecegiIl: string | null; gidecegiBolge: string | null }
): Promise<boolean> {
  if (YONETICI_ROLLERI.includes(user.role as Role)) return true;
  const ilEsit = (a?: string | null, b?: string | null) =>
    !!a && !!b && a.toLocaleLowerCase("tr") === b.toLocaleLowerCase("tr");
  if (user.role === "IL_SORUMLUSU") return ilEsit(basvuru.gidecegiIl, user.activeIlAd);
  if (user.role === "BOLGE_SORUMLUSU") {
    if (ilEsit(basvuru.gidecegiBolge, user.activeBolgeAd)) return true;
    if (!user.activeBolgeId || !basvuru.gidecegiIl) return false;
    const iller = await prisma.il.findMany({ where: { bolgeId: user.activeBolgeId }, select: { ad: true } });
    return iller.some(i => ilEsit(i.ad, basvuru.gidecegiIl));
  }
  return false;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const { durum, yoneticiNotu } = r.data;

  const mevcut = await prisma.ekKayitBasvuru.findUnique({
    where: { id },
    select: { durum: true, gidecegiIl: true, gidecegiBolge: true, ogrenciAd: true, ogrenciSoyad: true },
  });
  if (!mevcut) return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 });

  if (!(await canSee(session.user, mevcut))) {
    return NextResponse.json({ error: "Bu başvuruya erişim yetkiniz yok." }, { status: 403 });
  }

  const updated = await prisma.ekKayitBasvuru.update({
    where: { id },
    data: {
      ...(durum ? { durum } : {}),
      ...(yoneticiNotu !== undefined ? { yoneticiNotu: yoneticiNotu || null } : {}),
    },
  });

  if (durum && durum !== mevcut.durum) {
    createAuditLog({
      userId: session.user.id,
      action: ACTIONS.EKKAYIT_STATUS_CHANGED,
      entity: "EkKayitBasvuru",
      entityId: id,
      oldValue: { durum: mevcut.durum },
      newValue: { durum },
      description: `${mevcut.ogrenciAd} ${mevcut.ogrenciSoyad} ev/yurt başvurusu: ${mevcut.durum} → ${durum}`,
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true, durum: updated.durum });
}
