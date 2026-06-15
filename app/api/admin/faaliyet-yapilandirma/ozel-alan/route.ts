import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { createAuditLog } from "@/lib/audit";
import { OZEL_TIPLER, OZEL_TIP_KODLAR, slugKod } from "@/lib/ozel-alan";
import { LISE_KATEGORILER } from "@/lib/lise-faaliyet";
import { UNI_KATEGORILER } from "@/lib/universite-faaliyet";
import type { Sistem } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

function yetkili(u?: { role?: string; icerikYoneticisi?: boolean }) {
  return !!u && (u.role === "SISTEM_ADMIN" || !!u.icerikYoneticisi);
}

type GenclikSistem = "UNIVERSITE" | "LISE";
const defaults = (s: GenclikSistem) => (s === "UNIVERSITE" ? UNI_KATEGORILER : LISE_KATEGORILER);
const SISTEM_AD: Record<GenclikSistem, string> = { UNIVERSITE: "Üniversite Gençlik", LISE: "Lise Gençlik" };

/** GET — bir gençlik sisteminin özel alan tanımları + UI seçenekleri. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !yetkili(session.user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const sistem = String(searchParams.get("sistem") ?? "");
  if (sistem !== "UNIVERSITE" && sistem !== "LISE") {
    return NextResponse.json({ error: "Geçersiz sistem." }, { status: 400 });
  }

  const rows = await prisma.ozelAlan.findMany({
    where: { sistem: sistem as Sistem },
    orderBy: [{ sira: "asc" }, { ad: "asc" }],
  });

  const kategoriOpsiyon = defaults(sistem).filter(k => k.key !== "DIGER").map(k => ({ kodu: k.key, ad: k.label }));

  return NextResponse.json({
    sistem,
    sistemAd: SISTEM_AD[sistem],
    tipOpsiyon: OZEL_TIPLER,
    kategoriOpsiyon,
    alanlar: rows.map(a => ({
      kod: a.kod, ad: a.ad, tip: a.tip, kategoriKodu: a.kategoriKodu,
      zorunlu: a.zorunlu, sira: a.sira, secenekler: a.secenekler, aktif: a.aktif,
    })),
  });
}

const schema = z.object({
  sistem: z.enum(["UNIVERSITE", "LISE"]),
  alanlar: z
    .array(
      z.object({
        kod: z.string().trim().max(60).optional().nullable(),
        ad: z.string().trim().min(1).max(80),
        tip: z.string(),
        kategoriKodu: z.string().trim().max(40),
        zorunlu: z.boolean(),
        sira: z.coerce.number().int().min(0).max(999),
        secenekler: z.array(z.string().trim().max(80)).max(50),
        aktif: z.boolean(),
      }),
    )
    .max(200),
});

/** PUT — özel alanları topluca kaydeder (kod-kararlı; payloadda olmayanlar silinir). */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !yetkili(session.user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const d = r.data;
  const sistem = d.sistem as Sistem;
  const gecerliKat = new Set<string>(defaults(d.sistem).map(k => k.key));

  // Mevcut kodları rezerve et, yeni alanlara benzersiz kod üret (kod = JSON anahtarı, kararlı kalmalı)
  const used = new Set<string>();
  d.alanlar.forEach(a => { if (a.kod && a.kod.trim()) used.add(a.kod.trim()); });
  const uniqKod = (base: string) => {
    let k = base || "alan";
    let i = 2;
    while (used.has(k)) k = `${base}_${i++}`;
    used.add(k);
    return k;
  };

  const rows = d.alanlar
    .filter(a => OZEL_TIP_KODLAR.includes(a.tip) && (a.kategoriKodu === "" || gecerliKat.has(a.kategoriKodu)))
    .map(a => ({
      kod: a.kod && a.kod.trim() ? a.kod.trim() : uniqKod(slugKod(a.ad)),
      ad: a.ad,
      tip: a.tip,
      kategoriKodu: a.kategoriKodu,
      zorunlu: a.zorunlu,
      sira: a.sira,
      secenekler: a.tip === "TEK_SECIM" ? a.secenekler.map(s => s.trim()).filter(Boolean) : [],
      aktif: a.aktif,
    }));

  const finalKods = rows.map(r => r.kod);

  await prisma.$transaction([
    prisma.ozelAlan.deleteMany({
      where: { sistem, kod: { notIn: finalKods.length ? finalKods : ["__none__"] } },
    }),
    ...rows.map(r =>
      prisma.ozelAlan.upsert({
        where: { sistem_kod: { sistem, kod: r.kod } },
        update: { ad: r.ad, tip: r.tip, kategoriKodu: r.kategoriKodu, zorunlu: r.zorunlu, sira: r.sira, secenekler: r.secenekler, aktif: r.aktif },
        create: { sistem, kod: r.kod, ad: r.ad, tip: r.tip, kategoriKodu: r.kategoriKodu, zorunlu: r.zorunlu, sira: r.sira, secenekler: r.secenekler, aktif: r.aktif },
      }),
    ),
  ]);

  createAuditLog({
    userId: session.user.id,
    action: "OZEL_ALAN_GUNCELLENDI",
    entity: "OzelAlan",
    description: `${SISTEM_AD[d.sistem]} özel alanları güncellendi (${rows.length} alan)`,
  }).catch(console.error);

  return NextResponse.json({ ok: true, kayit: rows.length });
}
