import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { canManageDocs } from "@/lib/dokuman-access";
import { saveFile, deleteFile, IZINLI_TIPLER, MAX_DOSYA_BOYUTU } from "@/lib/storage";
import { dokumanBildirimleriOlustur } from "@/lib/bildirim";

export const dynamic = "force-dynamic";

/**
 * POST multipart — mevcut dokümanın YENİ SÜRÜMÜ.
 * Dosyayı değiştirir (eski depolama silinir), surum++ yapar ve seçilen
 * kanallara "güncellendi" bildirimi üretir. file + bildirim* ("1"/"0").
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  if (!canManageDocs(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const mevcut = await prisma.dokuman.findUnique({ where: { id } });
  if (!mevcut) return NextResponse.json({ error: "Doküman bulunamadı." }, { status: 404 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 }); }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  if (file.size > MAX_DOSYA_BOYUTU) return NextResponse.json({ error: "Dosya 20 MB'tan büyük olamaz." }, { status: 400 });
  const uzanti = IZINLI_TIPLER[file.type];
  if (!uzanti) return NextResponse.json({ error: "Desteklenmeyen dosya türü." }, { status: 400 });

  // Eski dosyayı sil, yenisini kaydet
  await deleteFile(mevcut.storageKey);
  const saved = await saveFile(Buffer.from(await file.arrayBuffer()), { fileName: file.name, contentType: file.type });

  const yeniSurum = mevcut.surum + 1;
  let url = saved.url;
  await prisma.dokuman.update({
    where: { id },
    data: {
      ad: file.name,
      url: url || mevcut.url,
      storageKey: saved.storageKey,
      boyut: file.size,
      mimeTipi: file.type,
      uzanti,
      surum: yeniSurum,
    },
  });
  if (!url) {
    url = `/api/dosya/${id}`;
    await prisma.dokuman.update({ where: { id }, data: { url } });
  }

  createAuditLog({
    userId: session.user.id,
    action: ACTIONS.DOC_UPDATED,
    entity: "Dokuman",
    entityId: id,
    description: `Doküman yeni sürüm (${yeniSurum}): ${file.name}`,
  }).catch(console.error);

  const flag = (k: string) => form.get(k) === "1";
  await dokumanBildirimleriOlustur({
    ad: file.name,
    klasorId: mevcut.klasorId,
    guncelleme: true,
    surum: yeniSurum,
    erisimEgitim: mevcut.erisimEgitim,
    erisimUniversite: mevcut.erisimUniversite,
    erisimLise: mevcut.erisimLise,
    erisimGonullu: mevcut.erisimGonullu,
    sistemBildirim: flag("bildirimSistem"),
    popup: flag("bildirimPopup"),
    duyuru: flag("bildirimDuyuru"),
    createdById: session.user.id,
    createdByName: `${session.user.ad} ${session.user.soyad}`,
  }).catch(console.error);

  return NextResponse.json({ ok: true, surum: yeniSurum, url });
}
