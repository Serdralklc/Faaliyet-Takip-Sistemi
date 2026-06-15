import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { createAuditLog } from "@/lib/audit";
import { GECERLI_DONEMLER, DONEM_LABEL, SISTEM_LABEL, donemGecerli } from "@/lib/faaliyet-yapilandirma";
import type { Sistem, Donem } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

/** Yetki: yalnızca Sistem Admini + İçerik Yöneticisi. */
function yetkili(u?: { role?: string; icerikYoneticisi?: boolean }) {
  return !!u && (u.role === "SISTEM_ADMIN" || !!u.icerikYoneticisi);
}

const SISTEMLER: Sistem[] = ["EGITIMCI", "UNIVERSITE", "LISE"];

/** GET — bir yıl için tüm sistemlerin dönem ayarları + UI için meta. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !yetkili(session.user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const simdiYil = new Date().getFullYear();
  const yil = Number(searchParams.get("yil")) || simdiYil;

  const ayarlar = await prisma.donemAyar.findMany({ where: { yil } });
  const ayarMap: Record<string, unknown> = {};
  for (const a of ayarlar) {
    ayarMap[`${a.sistem}__${a.donem}`] = {
      veriGirisiAcik: a.veriGirisiAcik,
      baslangic: a.baslangic ? a.baslangic.toISOString().slice(0, 10) : null,
      bitis: a.bitis ? a.bitis.toISOString().slice(0, 10) : null,
      aciklama: a.aciklama ?? "",
      guncelleyenAd: a.guncelleyenAd ?? null,
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  const sistemler = SISTEMLER.map((s) => ({
    kod: s,
    ad: SISTEM_LABEL[s],
    donemler: GECERLI_DONEMLER[s].map((d) => ({
      kod: d,
      ad: DONEM_LABEL[d],
      not: s === "EGITIMCI" && d === "YAZ_DONEMI" ? "yalnız İlköğretim" : null,
    })),
    yazYok: !GECERLI_DONEMLER[s].includes("YAZ_DONEMI"),
  }));

  return NextResponse.json({
    yil,
    yillar: [simdiYil - 2, simdiYil - 1, simdiYil, simdiYil + 1],
    sistemler,
    ayarlar: ayarMap,
  });
}

const schema = z
  .object({
    sistem: z.enum(["EGITIMCI", "UNIVERSITE", "LISE"]),
    yil: z.coerce.number().int().min(2000).max(2100),
    donem: z.enum(["DONEM_1", "DONEM_2", "YAZ_DONEMI"]),
    veriGirisiAcik: z.boolean(),
    baslangic: z.string().trim().optional().nullable(),
    bitis: z.string().trim().optional().nullable(),
    aciklama: z.string().trim().max(300).optional().nullable(),
  });

/** PUT — bir (sistem, yıl, dönem) dönem ayarını oluştur/güncelle. */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !yetkili(session.user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const d = r.data;

  const sistem = d.sistem as Sistem;
  const donem = d.donem as Donem;

  if (!donemGecerli(sistem, donem)) {
    return NextResponse.json(
      { error: `${SISTEM_LABEL[sistem]} sisteminde ${DONEM_LABEL[donem]} bulunmuyor.` },
      { status: 400 },
    );
  }

  const parseDate = (v?: string | null) => {
    if (!v) return null;
    const dt = new Date(v);
    return isNaN(dt.getTime()) ? null : dt;
  };
  const baslangic = parseDate(d.baslangic);
  const bitis = parseDate(d.bitis);
  if (baslangic && bitis && bitis < baslangic) {
    return NextResponse.json({ error: "Bitiş tarihi başlangıçtan önce olamaz." }, { status: 400 });
  }

  const guncelleyenAd = `${session.user.ad} ${session.user.soyad}`;
  const ayar = await prisma.donemAyar.upsert({
    where: { sistem_yil_donem: { sistem, yil: d.yil, donem } },
    update: {
      veriGirisiAcik: d.veriGirisiAcik,
      baslangic,
      bitis,
      aciklama: d.aciklama || null,
      guncelleyenId: session.user.id,
      guncelleyenAd,
    },
    create: {
      sistem,
      yil: d.yil,
      donem,
      veriGirisiAcik: d.veriGirisiAcik,
      baslangic,
      bitis,
      aciklama: d.aciklama || null,
      guncelleyenId: session.user.id,
      guncelleyenAd,
    },
  });

  createAuditLog({
    userId: session.user.id,
    action: "DONEM_AYAR_GUNCELLENDI",
    entity: "DonemAyar",
    entityId: ayar.id,
    description: `${SISTEM_LABEL[sistem]} ${d.yil} ${DONEM_LABEL[donem]} → ${d.veriGirisiAcik ? "AÇIK" : "KAPALI"}`,
  }).catch(console.error);

  return NextResponse.json(ayar);
}
