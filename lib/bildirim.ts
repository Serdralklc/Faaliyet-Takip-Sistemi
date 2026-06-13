import { prisma } from "./prisma";

/**
 * Bildirim oluşturup hedef kitleye dağıtır (BildirimAlim kayıtları).
 * Doküman entegrasyonu gibi otomatik tetiklemeler bunu kullanır.
 * E-posta GÖNDERMEZ (yalnızca sistem bildirimi) — e-posta gerekiyorsa /api/bildirimler kullanılır.
 *
 * Hedef kitle = seçilen sistemlerdeki Bölge/İl sorumluları (+ istenirse gönüllüler).
 * Döner: oluşturulan alıcı sayısı (0 ise bildirim yine kaydedilir ama alıcısızdır).
 */
export async function bildirimDagit(opts: {
  baslik: string;
  mesaj: string;
  tip?: "DUYURU" | "BILGILENDIRME" | "DOSYA" | "FORM";
  link?: string | null;
  sistemEgitim?: boolean;
  sistemUniversite?: boolean;
  sistemLise?: boolean;
  hedefGonullu?: boolean;
  createdById: string;
  createdByName: string;
}): Promise<{ bildirimId: string; aliciSayisi: number }> {
  const sistemEgitim = !!opts.sistemEgitim;
  const sistemUniversite = !!opts.sistemUniversite;
  const sistemLise = !!opts.sistemLise;
  const hedefGonullu = !!opts.hedefGonullu;

  const sistemler = [
    ...(sistemEgitim ? ["EGITIMCI"] : []),
    ...(sistemUniversite ? ["UNIVERSITE"] : []),
    ...(sistemLise ? ["LISE"] : []),
  ];
  const rolKosullari = sistemler.length
    ? [
        { role: "BOLGE_SORUMLUSU" as const, sistem: { in: sistemler as never } },
        { role: "IL_SORUMLUSU" as const, sistem: { in: sistemler as never } },
      ]
    : [];

  const [users, volunteers] = await Promise.all([
    rolKosullari.length
      ? prisma.user.findMany({ where: { status: "AKTIF", OR: rolKosullari }, select: { id: true, ad: true, soyad: true } })
      : Promise.resolve([]),
    hedefGonullu
      ? prisma.volunteer.findMany({ select: { id: true, adSoyad: true } })
      : Promise.resolve([]),
  ]);

  const bildirim = await prisma.bildirim.create({
    data: {
      baslik: opts.baslik,
      mesaj: opts.mesaj,
      tip: opts.tip ?? "DOSYA",
      link: opts.link || null,
      hedefBolge: sistemler.length > 0,
      hedefIl: sistemler.length > 0,
      hedefGonullu,
      sistemEgitim,
      sistemUniversite,
      sistemLise,
      createdById: opts.createdById,
      createdByName: opts.createdByName,
    },
  });

  if (users.length + volunteers.length > 0) {
    await prisma.bildirimAlim.createMany({
      data: [
        ...users.map(u => ({ bildirimId: bildirim.id, userId: u.id, aliciAd: `${u.ad} ${u.soyad}` })),
        ...volunteers.map(v => ({ bildirimId: bildirim.id, volunteerId: v.id, aliciAd: v.adSoyad })),
      ],
    });
  }

  return { bildirimId: bildirim.id, aliciSayisi: users.length + volunteers.length };
}

/**
 * Doküman erişim bayraklarından bildirim/pop-up/duyuru için ortak yardımcılar.
 * Klasör linki: panel kullanıcıları doküman görüntüleyiciyi /panel/dokumanlar'da kullanır.
 */
export function dokumanKlasorLink(klasorId: string | null | undefined): string {
  return klasorId ? `/panel/dokumanlar?klasorId=${encodeURIComponent(klasorId)}` : "/panel/dokumanlar";
}

/**
 * Bir doküman yüklendiğinde/güncellendiğinde seçilen kanallara göre içerik üretir:
 *  - sistemBildirim → erişimi olan kullanıcılara hedefli bildirim (tıkla → klasör)
 *  - duyuru → 7 gün görünecek üst bant duyurusu
 *  - popup → 7 gün her girişte gösterilecek pop-up
 */
export async function dokumanBildirimleriOlustur(opts: {
  ad: string;
  klasorId: string | null;
  guncelleme?: boolean;
  surum?: number;
  erisimEgitim: boolean;
  erisimUniversite: boolean;
  erisimLise: boolean;
  erisimGonullu: boolean;
  sistemBildirim: boolean;
  popup: boolean;
  duyuru: boolean;
  createdById: string;
  createdByName: string;
}): Promise<void> {
  if (!opts.sistemBildirim && !opts.popup && !opts.duyuru) return;

  const link = dokumanKlasorLink(opts.klasorId);
  const baslik = opts.guncelleme ? `Doküman güncellendi: ${opts.ad}` : `Yeni doküman: ${opts.ad}`;
  const mesaj = opts.guncelleme
    ? `📄 "${opts.ad}" güncellenmiştir${opts.surum ? ` (sürüm ${opts.surum})` : ""}.`
    : `📁 "${opts.ad}" dokümanı yüklenmiştir.`;
  const now = new Date();
  const bitis = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (opts.sistemBildirim) {
    await bildirimDagit({
      baslik, mesaj, tip: "DOSYA", link,
      sistemEgitim: opts.erisimEgitim,
      sistemUniversite: opts.erisimUniversite,
      sistemLise: opts.erisimLise,
      hedefGonullu: opts.erisimGonullu,
      createdById: opts.createdById,
      createdByName: opts.createdByName,
    });
  }
  if (opts.duyuru) {
    await prisma.duyuru.create({
      data: { metin: mesaj, link, baslangic: now, bitis, aktif: true, createdById: opts.createdById, createdByName: opts.createdByName },
    });
  }
  if (opts.popup) {
    await prisma.popup.create({
      data: { baslik, aciklama: mesaj, link, gosterim: "HER_GIRIS", baslangic: now, bitis, aktif: true, createdById: opts.createdById, createdByName: opts.createdByName },
    });
  }
}
