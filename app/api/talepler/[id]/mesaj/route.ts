import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson } from "@/lib/validation";
import { talepKarsilayanMi } from "@/lib/istisare";
import type { TalepBirim, TalepDurum } from "@/lib/istisare";
import { bildirimKullanicilara, talepHedefKullaniciIdleri, talepLink } from "@/lib/bildirim";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mesaj: z.string().trim().min(1, "Mesaj boş olamaz").max(5000),
  dosyalar: z.array(z.object({ ad: z.string().max(255), url: z.string().max(2000) })).max(10).optional().default([]),
});

// POST: talebe yanıt/mesaj ekle (oluşturan veya karşılayan taraf)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id: userId, role } = session.user;

  const talep = await prisma.talep.findUnique({ where: { id }, select: { olusturanId: true, birim: true, durum: true, baslik: true } });
  if (!talep) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });

  const olusturanMi = talep.olusturanId === userId;
  const karsilayanMi = talepKarsilayanMi(talep.birim as TalepBirim, role, session.user.yanRoller);
  if (!olusturanMi && !karsilayanMi) {
    return NextResponse.json({ error: "Bu talebe yanıt veremezsiniz" }, { status: 403 });
  }
  if (talep.durum === "KAPATILDI") {
    return NextResponse.json({ error: "Kapatılmış talebe mesaj eklenemez" }, { status: 400 });
  }

  const r = await parseJson(req, bodySchema);
  if ("error" in r) return r.error;
  const { mesaj, dosyalar } = r.data;

  // Durum otomatiği: karşılayan yanıtlarsa → Yanıtlandı; oluşturan yazarsa → İnceleniyor
  let yeniDurum: TalepDurum | undefined;
  const d = talep.durum as TalepDurum;
  if (karsilayanMi && !olusturanMi && (d === "YENI" || d === "INCELENIYOR")) yeniDurum = "YANITLANDI";
  else if (olusturanMi && d === "YANITLANDI") yeniDurum = "INCELENIYOR";

  await prisma.$transaction([
    prisma.talepMesaj.create({
      data: { talepId: id, gonderenId: userId, mesaj, dosyalar: dosyalar.map(x => JSON.stringify(x)) },
    }),
    prisma.talep.update({
      where: { id },
      data: { sonMesajAt: new Date(), ...(yeniDurum ? { durum: yeniDurum } : {}) },
    }),
  ]);

  await createAuditLog({
    userId, action: ACTIONS.TALEP_REPLIED, entity: "Talep", entityId: id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `İstişare talebine yanıt verildi`,
  }).catch(() => {});

  // Karşı tarafa otomatik bildirim (kapanana kadar her mesajda)
  try {
    const ad = `${session.user.ad} ${session.user.soyad}`;
    const link = talepLink(id);
    if (olusturanMi) {
      // oluşturan yazdı → karşılayan merkeze "Yeni Mesaj"
      const ids = (await talepHedefKullaniciIdleri(talep.birim as TalepBirim)).filter(x => x !== userId);
      await bildirimKullanicilara({
        userIds: ids,
        baslik: "🔔 Talebe Yeni Mesaj",
        mesaj: `Gönderen: ${ad}\nKonu: ${talep.baslik}`,
        tip: "BILGILENDIRME", link, createdById: userId, createdByName: ad,
      });
    } else {
      // karşılayan yazdı → talebi açana "Yeni Cevap"
      await bildirimKullanicilara({
        userIds: [talep.olusturanId],
        baslik: "🔔 Talebinize Yeni Cevap Geldi",
        mesaj: `Gönderen: ${ad}\nKonu: ${talep.baslik}`,
        tip: "BILGILENDIRME", link, createdById: userId, createdByName: ad,
      });
    }
  } catch (e) { console.error("Talep mesaj bildirimi:", e); }

  return NextResponse.json({ success: true, durum: yeniDurum });
}
