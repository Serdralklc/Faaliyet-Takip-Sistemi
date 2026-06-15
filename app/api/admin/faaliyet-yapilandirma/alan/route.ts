import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { createAuditLog } from "@/lib/audit";
import { SISTEM_LABEL } from "@/lib/faaliyet-yapilandirma";
import {
  EGITIM_ALAN_KATALOG, EGITIM_ALT_BIRIM_LABEL, EGITIM_ALT_BIRIMLER, EGITIM_GECERLI_KODLAR,
} from "@/lib/faaliyet-alanlar";
import type { Sistem } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

/** Yetki: yalnızca Sistem Admini + İçerik Yöneticisi. */
function yetkili(u?: { role?: string; icerikYoneticisi?: boolean }) {
  return !!u && (u.role === "SISTEM_ADMIN" || !!u.icerikYoneticisi);
}

/** GET — Eğitim Birimi alan kataloğu (alt birim bazında) + mevcut ayarlar. */
export async function GET() {
  const session = await getSession();
  if (!session?.user || !yetkili(session.user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const ayarlar = await prisma.alanAyar.findMany({ where: { sistem: "EGITIMCI" } });
  const ayarMap = new Map(ayarlar.map(a => [a.alanKodu, a]));

  const gruplar = EGITIM_ALT_BIRIMLER.map(b => ({
    kod: b,
    ad: EGITIM_ALT_BIRIM_LABEL[b],
    alanlar: EGITIM_ALAN_KATALOG[b].map(a => {
      const s = ayarMap.get(a.alanKodu);
      return {
        alanKodu: a.alanKodu,
        label: a.label,
        grup: a.grup ?? null,
        gorunur: s?.gorunur ?? true,
        zorunlu: s?.zorunlu ?? false,
        aktif: s?.aktif ?? true,
      };
    }),
  }));

  return NextResponse.json({ sistem: "EGITIMCI", sistemAd: SISTEM_LABEL.EGITIMCI, gruplar });
}

const schema = z.object({
  sistem: z.enum(["EGITIMCI", "UNIVERSITE", "LISE"]),
  alanlar: z
    .array(
      z.object({
        alanKodu: z.string().trim().min(1).max(80),
        gorunur: z.boolean(),
        zorunlu: z.boolean(),
        aktif: z.boolean(),
        sira: z.coerce.number().int().min(0).max(999).optional(),
      }),
    )
    .min(1)
    .max(300),
});

/** PUT — alan ayarlarını topluca oluştur/güncelle (yalnızca katalogdaki kodlar). */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !yetkili(session.user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const d = r.data;
  const sistem = d.sistem as Sistem;

  // Faz 1b: yalnızca Eğitim Birimi kataloğundaki geçerli kodlar
  const gecerli = d.alanlar.filter(a => EGITIM_GECERLI_KODLAR.has(a.alanKodu));
  if (gecerli.length === 0) {
    return NextResponse.json({ error: "Geçerli alan bulunamadı." }, { status: 400 });
  }

  const guncelleyenAd = `${session.user.ad} ${session.user.soyad}`;
  await prisma.$transaction(
    gecerli.map(a =>
      prisma.alanAyar.upsert({
        where: { sistem_alanKodu: { sistem, alanKodu: a.alanKodu } },
        update: {
          gorunur: a.gorunur, zorunlu: a.zorunlu, aktif: a.aktif, sira: a.sira ?? 0,
          guncelleyenId: session.user.id, guncelleyenAd,
        },
        create: {
          sistem, alanKodu: a.alanKodu,
          gorunur: a.gorunur, zorunlu: a.zorunlu, aktif: a.aktif, sira: a.sira ?? 0,
          guncelleyenId: session.user.id, guncelleyenAd,
        },
      }),
    ),
  );

  const gizli = gecerli.filter(a => !a.gorunur || !a.aktif).length;
  createAuditLog({
    userId: session.user.id,
    action: "ALAN_AYAR_GUNCELLENDI",
    entity: "AlanAyar",
    description: `${SISTEM_LABEL[sistem]} alan ayarları güncellendi (${gecerli.length} alan, ${gizli} gizli/pasif)`,
  }).catch(console.error);

  return NextResponse.json({ ok: true, kayit: gecerli.length });
}
