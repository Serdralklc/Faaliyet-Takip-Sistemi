import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { saveFile, IZINLI_TIPLER, MAX_DOSYA_BOYUTU } from "@/lib/storage";
import { gecerliKategori } from "@/lib/lise-faaliyet";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

const GORSEL_TIPLERI = ["image/png", "image/jpeg", "image/webp"];
const DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];
const gecerliDonem = (v: unknown) => DONEMLER.includes(String(v)) ? (String(v) as "DONEM_1" | "DONEM_2" | "YAZ_DONEMI") : "DONEM_1";

/** Yazma yetkisi: LISE sistemli il sorumlusu (kendi ili) veya sistem admini */
function yazabilir(user: { role: Role; sistem?: string | null; activeIlId?: string | null }, ilId: string) {
  if (user.role === "SISTEM_ADMIN") return true;
  return user.role === "IL_SORUMLUSU" && user.sistem === "LISE" && user.activeIlId === ilId;
}

/** Yüklenen dosyayı kaydet → {key, url, mime, ad, boyut} (yoksa null) */
async function dosyaKaydet(file: File | null, izinli: string[]): Promise<{ key: string; url: string; mime: string; ad: string; boyut: number } | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (!izinli.includes(file.type)) throw new Error("İzin verilmeyen dosya türü.");
  if (file.size > MAX_DOSYA_BOYUTU) throw new Error("Dosya 20 MB sınırını aşıyor.");
  const buf = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile(buf, { fileName: file.name || "dosya", contentType: file.type });
  return { key: saved.storageKey, url: saved.url, mime: file.type, ad: file.name || "dosya", boyut: file.size };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ilId = searchParams.get("ilId");
  const yil = searchParams.get("yil");
  const { role, activeIlId, activeBolgeId } = session.user;

  const donem = searchParams.get("donem");
  const where: Record<string, unknown> = {};
  if (yil) where.yil = Number(yil);
  if (donem) where.donem = donem;

  if (role === "IL_SORUMLUSU") {
    if (!activeIlId) return NextResponse.json([]);
    where.ilId = activeIlId;
  } else if (role === "BOLGE_SORUMLUSU") {
    if (!activeBolgeId) return NextResponse.json([]);
    const iller = await prisma.il.findMany({ where: { bolgeId: activeBolgeId }, select: { id: true } });
    const ilIdler = iller.map((i) => i.id);
    // Bölge sorumlusu kendi bölgesindeki belirli bir ile drill yapabilir
    where.ilId = ilId && ilIdler.includes(ilId) ? ilId : { in: ilIdler };
  } else if (ilId) {
    where.ilId = ilId;
  }

  const faaliyetler = await prisma.liseFaaliyet.findMany({
    where,
    orderBy: { tarih: "desc" },
    take: 1000,
  });
  return NextResponse.json(faaliyetler);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const ilId = String(form.get("ilId") ?? "");
  if (!ilId) return NextResponse.json({ error: "İl gerekli." }, { status: 400 });
  if (!yazabilir(session.user, ilId)) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const kategori = String(form.get("kategori") ?? "");
  if (!gecerliKategori(kategori)) return NextResponse.json({ error: "Geçersiz kategori." }, { status: 400 });

  const faaliyetAdi = String(form.get("faaliyetAdi") ?? "").trim();
  if (!faaliyetAdi) return NextResponse.json({ error: "Faaliyet adı gerekli." }, { status: 400 });

  const tarihStr = String(form.get("tarih") ?? "");
  const tarih = new Date(tarihStr);
  if (isNaN(tarih.getTime())) return NextResponse.json({ error: "Geçerli bir tarih girin." }, { status: 400 });

  const sayi = (k: string) => Math.max(0, Math.floor(Number(form.get(k)) || 0));

  let foto, dosya;
  try {
    foto = await dosyaKaydet(form.get("foto") as File | null, GORSEL_TIPLERI);
    dosya = await dosyaKaydet(form.get("dosya") as File | null, Object.keys(IZINLI_TIPLER));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Dosya yüklenemedi." }, { status: 400 });
  }

  const f = await prisma.liseFaaliyet.create({
    data: {
      ilId,
      tarih,
      yil: tarih.getFullYear(),
      donem: gecerliDonem(form.get("donem")),
      kategori,
      faaliyetAdi,
      aciklama: String(form.get("aciklama") ?? "").trim() || null,
      yer: String(form.get("yer") ?? "").trim() || null,
      katilimci: sayi("katilimci"),
      ilkKezKatilan: sayi("ilkKezKatilan"),
      yeniIntisap: sayi("yeniIntisap"),
      fotoKey: foto?.key ?? null, fotoUrl: foto?.url ?? null, fotoMime: foto?.mime ?? null,
      dosyaKey: dosya?.key ?? null, dosyaUrl: dosya?.url ?? null, dosyaMime: dosya?.mime ?? null,
      dosyaAd: dosya?.ad ?? null, dosyaBoyut: dosya?.boyut ?? null,
      createdById: session.user.id,
      createdByName: `${session.user.ad} ${session.user.soyad}`,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.LISE_FAALIYET_CREATED,
    entity: "LiseFaaliyet",
    entityId: f.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json(f);
}
