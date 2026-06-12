export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LogFilters } from "./LogFilters";

const PAGE_SIZE = 50;

const ACTION_LABEL: Record<string, string> = {
  KULLANICI_OLUSTURULDU: "Kayıt",
  KULLANICI_DAVET_EDILDI: "Davet Gönderildi",
  KULLANICI_ONAYLANDI: "Onaylandı",
  KULLANICI_REDDEDILDI: "Reddedildi",
  SIFRE_OLUSTURULDU: "Şifre Oluşturuldu",
  SIFRE_SIFIRLANDI: "Şifre Sıfırlandı",
  ROL_DEGISTIRILDI: "Rol Değiştirildi",
  IL_ATANDI: "İl Atandı",
  BOLGE_ATANDI: "Bölge Atandı",
  GOREV_DEVRI_YAPILDI: "Görev Devri",
  KULLANICI_PASIFLESTIRILDI: "Pasifleştirildi",
  FAALIYET_OLUSTURULDU: "Faaliyet Eklendi",
  FAALIYET_GUNCELLENDI: "Faaliyet Güncellendi",
  FAALIYET_SILINDI: "Faaliyet Silindi",
  BURS_DURUM_GUNCELLENDI: "Burs Kararı",
  EK_KAYIT_DURUM_GUNCELLENDI: "Ek Kayıt Kararı",
  GERIBILDIRIM_DURUM_GUNCELLENDI: "Geri Bildirim Durumu",
  HEDEF_OLUSTURULDU: "Hedef Oluşturuldu",
  HEDEF_GUNCELLENDI: "Hedef Güncellendi",
  BARINMA_BIRIM_OLUSTURULDU: "Barınma Birimi Eklendi",
  BARINMA_BIRIM_GUNCELLENDI: "Barınma Birimi Güncellendi",
  BARINMA_BIRIM_SILINDI: "Barınma Birimi Silindi",
  BARINMA_OGRENCI_KAYDEDILDI: "Barınma Öğrenci Kaydı",
  BARINMA_OGRENCI_SILINDI: "Barınma Öğrenci Silindi",
  BARINMA_ZIYARET_EKLENDI: "Ziyaret Kaydı Eklendi",
  BARINMA_ZIYARET_SILINDI: "Ziyaret Kaydı Silindi",
  DOKUMAN_KLASOR_OLUSTURULDU: "Klasör Oluşturuldu",
  DOKUMAN_KLASOR_GUNCELLENDI: "Klasör Güncellendi",
  DOKUMAN_KLASOR_SILINDI: "Klasör Silindi",
  DOKUMAN_YUKLENDI: "Doküman Yüklendi",
  DOKUMAN_GUNCELLENDI: "Doküman Güncellendi",
  DOKUMAN_SILINDI: "Doküman Silindi",
  DOKUMAN_PAYLASIM_OLUSTURULDU: "Paylaşım Linki",
  FORM_OLUSTURULDU: "Form Oluşturuldu",
  FORM_GUNCELLENDI: "Form Güncellendi",
  FORM_YAYINLANDI: "Form Yayınlandı",
  FORM_KAPATILDI: "Form Kapatıldı",
  FORM_SILINDI: "Form Silindi",
  FORM_YANITLANDI: "Form Yanıtlandı",
  BILDIRIM_GONDERILDI: "Bildirim Gönderildi",
  DONEM_ARSIVLENDI: "Dönem Arşivlendi",
  DONEM_ARSIVDEN_CIKARILDI: "Arşivden Çıkarıldı",
};

const ACTION_COLOR: Record<string, string> = {
  KULLANICI_OLUSTURULDU: "bg-blue-100 text-blue-700",
  KULLANICI_DAVET_EDILDI: "bg-indigo-100 text-indigo-700",
  KULLANICI_ONAYLANDI: "bg-green-100 text-green-700",
  KULLANICI_REDDEDILDI: "bg-red-100 text-red-700",
  SIFRE_SIFIRLANDI: "bg-amber-100 text-amber-700",
  GOREV_DEVRI_YAPILDI: "bg-purple-100 text-purple-700",
  FAALIYET_OLUSTURULDU: "bg-emerald-100 text-emerald-700",
  FAALIYET_GUNCELLENDI: "bg-yellow-100 text-yellow-700",
  FAALIYET_SILINDI: "bg-red-100 text-red-700",
  KULLANICI_PASIFLESTIRILDI: "bg-subtle text-secondary",
  BURS_DURUM_GUNCELLENDI: "bg-teal-100 text-teal-700",
  EK_KAYIT_DURUM_GUNCELLENDI: "bg-cyan-100 text-cyan-700",
  GERIBILDIRIM_DURUM_GUNCELLENDI: "bg-sky-100 text-sky-700",
  HEDEF_OLUSTURULDU: "bg-lime-100 text-lime-700",
  HEDEF_GUNCELLENDI: "bg-lime-100 text-lime-700",
};

interface SearchParams {
  islem?: string;
  kullanici?: string;
  baslangic?: string;
  bitis?: string;
  sayfa?: string;
}

export default async function LoglarPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  const { role, sistem } = session.user;
  const YETKILI = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  if (!YETKILI.includes(role)) redirect("/");

  const sp = await searchParams;
  const sayfa = Math.max(1, parseInt(sp.sayfa ?? "1", 10) || 1);

  const SISTEM_KISITLI = ["TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  const sistemFilter = (SISTEM_KISITLI.includes(role) && sistem)
    ? { user: { sistem: sistem as never } }
    : {};

  // Tarih aralığı: bitiş günü dahil (gün sonuna kadar)
  const baslangicDate = sp.baslangic ? new Date(`${sp.baslangic}T00:00:00`) : undefined;
  const bitisDate = sp.bitis ? new Date(`${sp.bitis}T23:59:59.999`) : undefined;

  const where = {
    ...sistemFilter,
    ...(sp.islem ? { action: sp.islem } : {}),
    ...(sp.kullanici
      ? {
          user: {
            ...(sistemFilter as { user?: object }).user,
            OR: [
              { ad:    { contains: sp.kullanici, mode: "insensitive" as const } },
              { soyad: { contains: sp.kullanici, mode: "insensitive" as const } },
              { email: { contains: sp.kullanici, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
    ...(baslangicDate || bitisDate
      ? { createdAt: { ...(baslangicDate ? { gte: baslangicDate } : {}), ...(bitisDate ? { lte: bitisDate } : {}) } }
      : {}),
  };

  const [loglar, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (sayfa - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { ad: true, soyad: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Sayfalama linklerinde filtreleri koru
  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (sp.islem) params.set("islem", sp.islem);
    if (sp.kullanici) params.set("kullanici", sp.kullanici);
    if (sp.baslangic) params.set("baslangic", sp.baslangic);
    if (sp.bitis) params.set("bitis", sp.bitis);
    if (p > 1) params.set("sayfa", String(p));
    return `/panel/admin/loglar${params.size ? `?${params}` : ""}`;
  }

  const actionOptions = Object.entries(ACTION_LABEL).map(([value, label]) => ({ value, label }));

  return (
    <div className="p-6 lg:p-8">
      <div className="sv-page-header">
        <h1>Denetim Logları</h1>
        <p>{total.toLocaleString("tr-TR")} kayıt (değiştirilemez denetim izi)</p>
      </div>

      <div className="sv-section">
        <LogFilters
          actionOptions={actionOptions}
          initial={{ islem: sp.islem, kullanici: sp.kullanici, baslangic: sp.baslangic, bitis: sp.bitis }}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 760 }}>
            <thead className="bg-th border-b border-border">
              <tr>
                <th scope="col" className="text-left px-4 py-3 font-medium text-muted text-xs">Tarih/Saat</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-muted text-xs">İşlem</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-muted text-xs">Kullanan</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-muted text-xs">Kayıt Türü</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-muted text-xs">Açıklama</th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-muted text-xs">IP Adresi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loglar.map((log) => (
                <tr key={log.id} className="hover:bg-th">
                  <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${ACTION_COLOR[log.action] ?? "bg-subtle text-secondary"}`}>
                      {ACTION_LABEL[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-secondary text-xs whitespace-nowrap">
                    {log.user ? `${log.user.ad} ${log.user.soyad}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{log.entity}</td>
                  <td className="px-4 py-3 text-muted text-xs max-w-xs truncate">
                    {log.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs font-mono">
                    {log.ipAddress ?? "—"}
                  </td>
                </tr>
              ))}
              {loglar.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    Bu filtrelerle eşleşen log kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border text-[12.5px] text-muted">
          <span>
            {total === 0 ? "0" : `${(sayfa - 1) * PAGE_SIZE + 1}–${Math.min(sayfa * PAGE_SIZE, total)}`} / {total.toLocaleString("tr-TR")} kayıt
          </span>
          <div className="ml-auto flex items-center gap-2">
            {sayfa > 1 ? (
              <Link href={pageHref(sayfa - 1)} className="px-3 py-1.5 rounded-lg border border-border font-semibold text-secondary hover:bg-[var(--bg-hover)] transition">
                ← Önceki
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg border border-border opacity-40">← Önceki</span>
            )}
            <span className="font-semibold text-secondary">{sayfa} / {totalPages}</span>
            {sayfa < totalPages ? (
              <Link href={pageHref(sayfa + 1)} className="px-3 py-1.5 rounded-lg border border-border font-semibold text-secondary hover:bg-[var(--bg-hover)] transition">
                Sonraki →
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg border border-border opacity-40">Sonraki →</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
