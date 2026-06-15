import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { saveFile, deleteFile, IZINLI_TIPLER, MAX_DOSYA_BOYUTU } from "@/lib/storage";
import { gecerliKategori } from "@/lib/lise-faaliyet";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

const GORSEL_TIPLERI = ["image/png", "image/jpeg", "image/webp"];
const DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];
const gecerliDonem = (v: unknown) => DONEMLER.includes(String(v)) ? (String(v) as "DONEM_1" | "DONEM_2" | "YAZ_DONEMI") : "DONEM_1";

function yazabilir(user: { role: Role; sistem?: string | null; activeIlId?: string | null }, ilId: string) {
  if (user.role === "SISTEM_ADMIN") return true;
  return user.role === "IL_SORUMLUSU" && user.sistem === "LISE" && user.activeIlId === ilId;
}

async function dosyaKaydet(file: File | null, izinli: string[]) {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (!izinli.includes(file.type)) throw new Error("İzin verilmeyen dosya türü.");
  if (file.size > MAX_DOSYA_BOYUTU) throw new Error("Dosya 20 MB sınırını aşıyor.");
  const buf = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile(buf, { fileName: file.name || "dosya", contentType: file.type });
  return { key: saved.storageKey, url: saved.url, mime: file.type, ad: file.name || "dosya", boyut: file.size };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const mevcut = await prisma.liseFaaliyet.findUnique({ where: { id } });
  if (!mevcut) return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  if (!yazabilir(session.user, mevcut.ilId)) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 }); }

  const kategori = String(form.get("kategori") ?? "");
  if (!gecerliKategori(kategori)) return NextResponse.json({ error: "Geçersiz kategori." }, { status: 400 });
  const faaliyetAdi = String(form.get("faaliyetAdi") ?? "").trim();
  if (!faaliyetAdi) return NextResponse.json({ error: "Faaliyet adı gerekli." }, { status: 400 });
  const tarih = new Date(String(form.get("tarih") ?? ""));
  if (isNaN(tarih.getTime())) return NextResponse.json({ error: "Geçerli bir tarih girin." }, { status: 400 });

  const sayi = (k: string) => Math.max(0, Math.floor(Number(form.get(k)) || 0));

  // Yeni dosya geldiyse kaydet (eskiyi sonra sileriz). "fotoSil"/"dosyaSil" = mevcut eki kaldır.
  let foto, dosya;
  try {
    foto = await dosyaKaydet(form.get("foto") as File | null, GORSEL_TIPLERI);
    dosya = await dosyaKaydet(form.get("dosya") as File | null, Object.keys(IZINLI_TIPLER));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Dosya yüklenemedi." }, { status: 400 });
  }
  const fotoSil = form.get("fotoSil") === "1";
  const dosyaSil = form.get("dosyaSil") === "1";

  const data: Record<string, unknown> = {
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
  };
  if (foto) { data.fotoKey = foto.key; data.fotoUrl = foto.url; data.fotoMime = foto.mime; }
  else if (fotoSil) { data.fotoKey = null; data.fotoUrl = null; data.fotoMime = null; }
  if (dosya) { data.dosyaKey = dosya.key; data.dosyaUrl = dosya.url; data.dosyaMime = dosya.mime; data.dosyaAd = dosya.ad; data.dosyaBoyut = dosya.boyut; }
  else if (dosyaSil) { data.dosyaKey = null; data.dosyaUrl = null; data.dosyaMime = null; data.dosyaAd = null; data.dosyaBoyut = null; }

  const ozelRaw = form.get("ozelAlanlar");
  if (typeof ozelRaw === "string" && ozelRaw.trim()) {
    try { data.ozelAlanlar = JSON.parse(ozelRaw); } catch { /* geçersiz JSON: yok say */ }
  }

  const f = await prisma.liseFaaliyet.update({ where: { id }, data });

  // Eski dosyaları temizle (yeni yüklendiyse veya silindiyse)
  if ((foto || fotoSil) && mevcut.fotoKey) await deleteFile(mevcut.fotoKey);
  if ((dosya || dosyaSil) && mevcut.dosyaKey) await deleteFile(mevcut.dosyaKey);

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.LISE_FAALIYET_UPDATED,
    entity: "LiseFaaliyet",
    entityId: f.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json(f);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const mevcut = await prisma.liseFaaliyet.findUnique({ where: { id } });
  if (!mevcut) return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  if (!yazabilir(session.user, mevcut.ilId)) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  await prisma.liseFaaliyet.delete({ where: { id } });
  if (mevcut.fotoKey) await deleteFile(mevcut.fotoKey);
  if (mevcut.dosyaKey) await deleteFile(mevcut.dosyaKey);

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.LISE_FAALIYET_DELETED,
    entity: "LiseFaaliyet",
    entityId: id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
