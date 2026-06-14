import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { saveFile } from "@/lib/storage";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

export const GORSEL_TIPLERI: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
export const MAX_GORSEL = 10 * 1024 * 1024; // 10 MB
export const GOSTERIMLER = ["TEK_SEFER", "HER_GIRIS", "SUREKLI", "TARIH_ARALIGI"];

/** GET — tüm pop-up'lar (yönetici) */
export async function GET() {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const popuplar = await prisma.popup.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { gorulmeler: true } } },
  });
  return NextResponse.json(popuplar.map(p => ({ ...p, gorulenSayisi: p._count.gorulmeler })));
}

/** POST multipart — yeni pop-up (opsiyonel görsel) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 }); }

  const baslik = ((form.get("baslik") as string) || "").trim();
  const aciklama = ((form.get("aciklama") as string) || "").trim();
  const link = ((form.get("link") as string) || "").trim();
  const gosterim = (form.get("gosterim") as string) || "HER_GIRIS";
  const aktif = form.get("aktif") !== "0";
  const baslangic = new Date(form.get("baslangic") as string);
  const bitis = new Date(form.get("bitis") as string);

  if (!baslik) return NextResponse.json({ error: "Başlık zorunludur." }, { status: 400 });
  if (!aciklama) return NextResponse.json({ error: "Açıklama zorunludur." }, { status: 400 });
  if (!GOSTERIMLER.includes(gosterim)) return NextResponse.json({ error: "Geçersiz gösterim seçeneği." }, { status: 400 });
  if (isNaN(+baslangic) || isNaN(+bitis)) return NextResponse.json({ error: "Geçerli başlangıç/bitiş tarihi girin." }, { status: 400 });
  if (bitis <= baslangic) return NextResponse.json({ error: "Bitiş tarihi başlangıçtan sonra olmalı." }, { status: 400 });

  let gorselUrl: string | null = null;
  let gorselKey: string | null = null;
  const file = form.get("gorsel");
  if (file instanceof File && file.size > 0) {
    if (!GORSEL_TIPLERI[file.type]) return NextResponse.json({ error: "Görsel PNG, JPG, WebP veya SVG olmalı." }, { status: 400 });
    if (file.size > MAX_GORSEL) return NextResponse.json({ error: "Görsel 10 MB'tan büyük olamaz." }, { status: 400 });
    try {
      const saved = await saveFile(Buffer.from(await file.arrayBuffer()), { fileName: file.name, contentType: file.type });
      gorselKey = saved.storageKey;
      gorselUrl = saved.url || null;
    } catch (e) {
      console.error("Pop-up görseli kaydedilemedi:", e);
      return NextResponse.json({ error: "Görsel kaydedilemedi. Depolama yapılandırması eksik olabilir (Blob)." }, { status: 500 });
    }
  }

  const popup = await prisma.popup.create({
    data: {
      baslik, aciklama, link: link || null,
      gosterim: gosterim as never,
      baslangic, bitis, aktif, gorselUrl, gorselKey,
      createdById: session.user.id,
      createdByName: `${session.user.ad} ${session.user.soyad}`,
    },
  });

  // Yerel sürücüde url boş gelir → kayıt id'siyle servis edilir
  if (gorselKey && !gorselUrl) {
    gorselUrl = `/api/popuplar/${popup.id}/gorsel`;
    await prisma.popup.update({ where: { id: popup.id }, data: { gorselUrl } });
  }

  createAuditLog({
    userId: session.user.id,
    action: "POPUP_OLUSTURULDU",
    entity: "Popup",
    entityId: popup.id,
    description: `Pop-up oluşturuldu: ${baslik}`,
  }).catch(console.error);

  return NextResponse.json({ ...popup, gorselUrl }, { status: 201 });
}
