import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { saveFile, deleteFile } from "@/lib/storage";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { GORSEL_TIPLERI, MAX_GORSEL, GOSTERIMLER } from "../route";

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

/**
 * PATCH — pop-up güncelle.
 *  - JSON gövde: hızlı alan güncelleme (ör. { aktif: false }).
 *  - multipart/form-data: tam düzenleme + opsiyonel yeni görsel / görsel silme.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const mevcut = await prisma.popup.findUnique({ where: { id } });
  if (!mevcut) return NextResponse.json({ error: "Pop-up bulunamadı." }, { status: 404 });

  const ct = req.headers.get("content-type") || "";

  // ── JSON: hızlı güncelleme (aktif/pasif vb.) ──
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => null);
    const data: Record<string, unknown> = {};
    if (typeof body?.aktif === "boolean") data.aktif = body.aktif;
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
    const popup = await prisma.popup.update({ where: { id }, data });
    createAuditLog({ userId: session.user.id, action: "POPUP_GUNCELLENDI", entity: "Popup", entityId: id, description: `Pop-up güncellendi (aktif: ${data.aktif})` }).catch(console.error);
    return NextResponse.json(popup);
  }

  // ── multipart: tam düzenleme ──
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 }); }

  const baslik = ((form.get("baslik") as string) || "").trim();
  const aciklama = ((form.get("aciklama") as string) || "").trim();
  const link = ((form.get("link") as string) || "").trim();
  const gosterim = (form.get("gosterim") as string) || mevcut.gosterim;
  const aktif = form.get("aktif") !== "0";
  const baslangic = new Date(form.get("baslangic") as string);
  const bitis = new Date(form.get("bitis") as string);

  if (!baslik) return NextResponse.json({ error: "Başlık zorunludur." }, { status: 400 });
  if (!aciklama) return NextResponse.json({ error: "Açıklama zorunludur." }, { status: 400 });
  if (!GOSTERIMLER.includes(gosterim)) return NextResponse.json({ error: "Geçersiz gösterim seçeneği." }, { status: 400 });
  if (isNaN(+baslangic) || isNaN(+bitis)) return NextResponse.json({ error: "Geçerli başlangıç/bitiş tarihi girin." }, { status: 400 });
  if (bitis <= baslangic) return NextResponse.json({ error: "Bitiş tarihi başlangıçtan sonra olmalı." }, { status: 400 });

  let gorselUrl = mevcut.gorselUrl;
  let gorselKey = mevcut.gorselKey;
  const gorselSil = form.get("gorselSil") === "1";
  const file = form.get("gorsel");

  if (gorselSil && mevcut.gorselKey) {
    await deleteFile(mevcut.gorselKey);
    gorselUrl = null; gorselKey = null;
  }
  if (file instanceof File && file.size > 0) {
    if (!GORSEL_TIPLERI[file.type]) return NextResponse.json({ error: "Görsel PNG, JPG, WebP veya SVG olmalı." }, { status: 400 });
    if (file.size > MAX_GORSEL) return NextResponse.json({ error: "Görsel 10 MB'tan büyük olamaz." }, { status: 400 });
    if (mevcut.gorselKey) await deleteFile(mevcut.gorselKey);
    try {
      const saved = await saveFile(Buffer.from(await file.arrayBuffer()), { fileName: file.name, contentType: file.type });
      gorselKey = saved.storageKey;
      gorselUrl = saved.url || `/api/popuplar/${id}/gorsel`;
    } catch (e) {
      console.error("Pop-up görseli kaydedilemedi:", e);
      return NextResponse.json({ error: "Görsel kaydedilemedi. Depolama yapılandırması eksik olabilir (Blob)." }, { status: 500 });
    }
  }

  const popup = await prisma.popup.update({
    where: { id },
    data: { baslik, aciklama, link: link || null, gosterim: gosterim as never, baslangic, bitis, aktif, gorselUrl, gorselKey },
  });

  createAuditLog({ userId: session.user.id, action: "POPUP_GUNCELLENDI", entity: "Popup", entityId: id, description: `Pop-up güncellendi: ${baslik}` }).catch(console.error);
  return NextResponse.json(popup);
}

/** DELETE — pop-up sil (+ görsel) */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const mevcut = await prisma.popup.findUnique({ where: { id }, select: { gorselKey: true } });
  if (!mevcut) return NextResponse.json({ error: "Pop-up bulunamadı." }, { status: 404 });

  await prisma.popup.delete({ where: { id } });
  if (mevcut.gorselKey) await deleteFile(mevcut.gorselKey);

  createAuditLog({ userId: session.user.id, action: "POPUP_SILINDI", entity: "Popup", entityId: id, description: "Pop-up silindi" }).catch(console.error);
  return NextResponse.json({ ok: true });
}
