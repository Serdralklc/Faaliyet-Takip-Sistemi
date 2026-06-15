import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { createAuditLog } from "@/lib/audit";
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

/** GET — bir gençlik sisteminin kategori + faaliyet türü yönetim görünümü. */
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

  const base = defaults(sistem);
  const [overlay, turler] = await Promise.all([
    prisma.kategoriAyar.findMany({ where: { sistem: sistem as Sistem } }),
    prisma.faaliyetTuru.findMany({ where: { sistem: sistem as Sistem }, orderBy: [{ sira: "asc" }, { ad: "asc" }] }),
  ]);
  const ovMap = new Map(overlay.map(o => [o.kategoriKodu, o]));
  const turMap = new Map<string, string[]>();
  for (const t of turler) {
    const arr = turMap.get(t.kategoriKodu) ?? [];
    arr.push(t.ad);
    turMap.set(t.kategoriKodu, arr);
  }

  const kategoriler = base
    .filter(k => k.key !== "DIGER") // "Diğer" tamamen manuel — yönetilmez
    .map(k => {
      const ov = ovMap.get(k.key);
      const dbTur = turMap.get(k.key);
      const turlerListe = dbTur && dbTur.length ? dbTur : k.adlar.filter(a => a !== "Diğer");
      return {
        kodu: k.key,
        varsayilanAd: k.label,
        ad: ov?.ad ?? "",
        aktif: ov ? ov.aktif : true,
        renk: k.renk,
        turler: turlerListe,
      };
    });

  return NextResponse.json({ sistem, sistemAd: SISTEM_AD[sistem], kategoriler });
}

const schema = z.object({
  sistem: z.enum(["UNIVERSITE", "LISE"]),
  kategoriler: z
    .array(
      z.object({
        kodu: z.string().trim().min(1).max(40),
        ad: z.string().trim().max(80).optional().nullable(),
        aktif: z.boolean(),
        turler: z.array(z.string().trim().max(120)).max(100),
      }),
    )
    .min(1)
    .max(40),
});

/** PUT — kategori görüntü ayarları + faaliyet türlerini topluca kaydeder. */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !yetkili(session.user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const d = r.data;
  const sistem = d.sistem as GenclikSistem;

  const gecerliKodlar = new Set<string>(defaults(sistem).map(k => k.key));
  const siraMap = new Map<string, number>(defaults(sistem).map((k, i) => [k.key, i] as [string, number]));
  const kategoriler = d.kategoriler.filter(k => gecerliKodlar.has(k.kodu) && k.kodu !== "DIGER");
  if (kategoriler.length === 0) {
    return NextResponse.json({ error: "Geçerli kategori bulunamadı." }, { status: 400 });
  }

  const guncelleyenAd = `${session.user.ad} ${session.user.soyad}`;

  // Faaliyet türleri: kategori başına benzersiz, boş/"Diğer" hariç
  const turKayitlari: { sistem: Sistem; kategoriKodu: string; ad: string; sira: number }[] = [];
  for (const k of kategoriler) {
    const gorulen = new Set<string>();
    let sira = 0;
    for (const ham of k.turler) {
      const ad = ham.trim();
      if (!ad || ad.toLocaleLowerCase("tr") === "diğer" || gorulen.has(ad)) continue;
      gorulen.add(ad);
      turKayitlari.push({ sistem: sistem as Sistem, kategoriKodu: k.kodu, ad, sira: sira++ });
    }
  }

  await prisma.$transaction([
    ...kategoriler.map(k =>
      prisma.kategoriAyar.upsert({
        where: { sistem_kategoriKodu: { sistem: sistem as Sistem, kategoriKodu: k.kodu } },
        update: { ad: k.ad?.trim() || null, aktif: k.aktif, sira: siraMap.get(k.kodu) ?? 0, guncelleyenId: session.user.id, guncelleyenAd },
        create: { sistem: sistem as Sistem, kategoriKodu: k.kodu, ad: k.ad?.trim() || null, aktif: k.aktif, sira: siraMap.get(k.kodu) ?? 0, guncelleyenId: session.user.id, guncelleyenAd },
      }),
    ),
    prisma.faaliyetTuru.deleteMany({ where: { sistem: sistem as Sistem } }),
    ...(turKayitlari.length ? [prisma.faaliyetTuru.createMany({ data: turKayitlari })] : []),
  ]);

  createAuditLog({
    userId: session.user.id,
    action: "KATEGORI_AYAR_GUNCELLENDI",
    entity: "KategoriAyar",
    description: `${SISTEM_AD[sistem]} kategori/tür ayarları güncellendi (${kategoriler.length} kategori, ${turKayitlari.length} tür)`,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
