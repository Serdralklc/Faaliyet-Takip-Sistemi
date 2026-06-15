import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { donemGirisDurum, alanAyarlari } from "@/lib/faaliyet-yapilandirma";
import type { Sistem, Donem } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

const SISTEMLER = ["EGITIMCI", "UNIVERSITE", "LISE"];
const DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];

/**
 * Giriş formlarının kullandığı okuma ucu (oturum açan herkes):
 * - donemAcik / donemSebep: seçilen yıl+dönem için kilit durumu (admin/merkez muaf).
 * - alanlar: alanKodu → { gorunur, zorunlu, aktif } (kayıt yoksa varsayılan).
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sistemRaw = String(searchParams.get("sistem") ?? "EGITIMCI");
  const sistem = (SISTEMLER.includes(sistemRaw) ? sistemRaw : "EGITIMCI") as Sistem;
  const yil = Number(searchParams.get("yil")) || new Date().getFullYear();
  const donemRaw = String(searchParams.get("donem") ?? "DONEM_1");
  const donem = (DONEMLER.includes(donemRaw) ? donemRaw : "DONEM_1") as Donem;

  const durum = await donemGirisDurum(sistem, yil, donem);
  // Admin/Merkez kilitten muaftır → onlar için her zaman açık görünür.
  const muaf = session.user.role !== "IL_SORUMLUSU";
  const donemAcik = muaf ? true : durum.acik;

  const ayarMap = await alanAyarlari(sistem);
  const alanlar: Record<string, { gorunur: boolean; zorunlu: boolean; aktif: boolean }> = {};
  for (const [k, v] of ayarMap) {
    alanlar[k] = { gorunur: v.gorunur, zorunlu: v.zorunlu, aktif: v.aktif };
  }

  return NextResponse.json({
    donemAcik,
    donemSebep: muaf ? null : durum.sebep,
    alanlar,
  });
}
