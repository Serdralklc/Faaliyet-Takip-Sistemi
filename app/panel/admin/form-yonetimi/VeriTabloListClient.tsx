"use client";

/** Form Yönetimi → "Veri Tablosu" sekmesi: veri tablolarını listeler, yayınla/kapat/sil. */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, BarChart3, Trash2, Table2, Archive } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatDateTR } from "@/lib/format";
import { stripTags } from "@/lib/sanitize-html";

type Durum = "TASLAK" | "YAYINDA" | "KAPALI" | "PASIF" | "ARSIV";

interface TabloOzet {
  id: string;
  baslik: string;
  aciklama?: string | null;
  durum: Durum;
  hedefBolge: boolean; hedefIl: boolean;
  sistemEgitim: boolean; sistemUniversite: boolean; sistemLise: boolean;
  createdByName: string;
  createdAt: string;
  _count: { kayitlar: number; sutunlar: number };
}

const DURUM_BADGE: Record<Durum, { label: string; tone: "neutral" | "success" | "danger" | "warning" }> = {
  TASLAK: { label: "Taslak", tone: "neutral" },
  YAYINDA: { label: "Yayında", tone: "success" },
  KAPALI: { label: "Kapalı", tone: "danger" },
  PASIF: { label: "Pasif", tone: "warning" },
  ARSIV: { label: "Arşiv", tone: "neutral" },
};

type DurumFiltre = "AKTIF" | "TASLAK" | "PASIF" | "ARSIV" | "HEPSI";
const DURUM_FILTRELER: { key: DurumFiltre; label: string }[] = [
  { key: "AKTIF",  label: "Aktif" },
  { key: "TASLAK", label: "Taslak" },
  { key: "PASIF",  label: "Pasif / Kapalı" },
  { key: "ARSIV",  label: "Arşiv" },
  { key: "HEPSI",  label: "Tümü" },
];
function durumFiltreUygula(durum: Durum, filtre: DurumFiltre): boolean {
  if (filtre === "HEPSI") return true;
  if (filtre === "AKTIF") return durum === "YAYINDA";
  if (filtre === "TASLAK") return durum === "TASLAK";
  if (filtre === "PASIF") return durum === "PASIF" || durum === "KAPALI";
  return durum === "ARSIV";
}

export function VeriTabloListClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [silinecek, setSilinecek] = useState<TabloOzet | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [durumFiltre, setDurumFiltre] = useState<DurumFiltre>("AKTIF");

  const { data: tablolar = [], isLoading } = useQuery({
    queryKey: ["veri-tablolari"],
    queryFn: async (): Promise<TabloOzet[]> => {
      const res = await fetch("/api/veri-tablolari");
      if (!res.ok) throw new Error("Veri tabloları yüklenemedi.");
      return res.json();
    },
  });

  async function durumDegistir(t: TabloOzet, durum: Durum) {
    setBusyId(t.id);
    try {
      const res = await fetch(`/api/veri-tablolari/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ durum }) });
      if (!res.ok) { const d = await res.json().catch(() => null); toast({ type: "error", title: "Durum güncellenemedi", message: d?.error }); return; }
      toast({ type: "success", title: durum === "YAYINDA" ? "Tablo yayınlandı" : "Tablo güncellendi", message: t.baslik });
      queryClient.invalidateQueries({ queryKey: ["veri-tablolari"] });
    } catch { toast({ type: "error", title: "Bağlantı hatası" }); } finally { setBusyId(null); }
  }

  async function handleSil() {
    if (!silinecek) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/veri-tablolari/${silinecek.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => null); toast({ type: "error", title: "Silinemedi", message: d?.error }); return; }
      toast({ type: "success", title: "Veri tablosu silindi", message: silinecek.baslik });
      setSilinecek(null);
      queryClient.invalidateQueries({ queryKey: ["veri-tablolari"] });
    } catch { toast({ type: "error", title: "Bağlantı hatası" }); } finally { setDeleting(false); }
  }

  const gosterilenTablolar = tablolar.filter(t => durumFiltreUygula(t.durum, durumFiltre));

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link href="/panel/admin/form-yonetimi/veri-tablosu/yeni"><Button><Plus size={15} />Yeni Veri Tablosu</Button></Link>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="sv-section p-5 space-y-3"><Skeleton className="h-4 w-56" /><Skeleton className="h-3 w-40" /></div>)}
        </div>
      ) : tablolar.length === 0 ? (
        <div className="sv-section px-6 py-16 text-center">
          <Table2 size={32} className="mx-auto text-muted mb-3" aria-hidden="true" />
          <p className="text-[14.5px] font-semibold text-heading">Henüz veri tablosu oluşturulmamış</p>
          <p className="text-[13px] text-muted mt-1 mb-5">İl/bölge sorumlularının sınırsız satır girebileceği ilk tablonuzu oluşturun.</p>
          <Link href="/panel/admin/form-yonetimi/veri-tablosu/yeni"><Button><Plus size={15} />Yeni Veri Tablosu</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {DURUM_FILTRELER.map(df => {
              const aktif = durumFiltre === df.key;
              return (
                <button key={df.key} onClick={() => setDurumFiltre(df.key)}
                  className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold border transition"
                  style={aktif
                    ? { background: "var(--green-primary)", borderColor: "var(--green-primary)", color: "#fff" }
                    : { background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  {df.label}
                </button>
              );
            })}
          </div>
          {gosterilenTablolar.length === 0 ? (
            <div className="sv-section px-6 py-10 text-center"><p className="text-[13px] text-muted">Bu filtreye uygun veri tablosu yok.</p></div>
          ) : gosterilenTablolar.map(t => {
          const durum = DURUM_BADGE[t.durum];
          const busy = busyId === t.id;
          return (
            <div key={t.id} className="sv-section p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-bold text-heading">{t.baslik}</h2>
                    <Badge tone={durum.tone}>{durum.label}</Badge>
                  </div>
                  {t.aciklama && <p className="text-[13px] text-muted mt-1 line-clamp-2">{stripTags(t.aciklama)}</p>}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <Badge tone="neutral">{t._count.sutunlar} sütun</Badge>
                    <Badge tone="neutral">{t._count.kayitlar} kayıt</Badge>
                  </div>
                  <p className="text-[12px] text-muted mt-2.5">{t.createdByName} · {formatDateTR(t.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <Link href={`/panel/admin/form-yonetimi/veri-tablosu/${t.id}`}><Button size="sm" variant="secondary"><Pencil size={13} />Düzenle</Button></Link>
                  {t.durum === "TASLAK" && <Button size="sm" loading={busy} onClick={() => durumDegistir(t, "YAYINDA")}>Yayınla</Button>}
                  {t.durum === "YAYINDA" && <Button size="sm" variant="secondary" loading={busy} onClick={() => durumDegistir(t, "KAPALI")}>Kapat</Button>}
                  {(t.durum === "KAPALI" || t.durum === "PASIF" || t.durum === "ARSIV") && <Button size="sm" variant="outline" loading={busy} onClick={() => durumDegistir(t, "YAYINDA")}>Aktifleştir</Button>}
                  {t.durum === "YAYINDA" && <Button size="sm" variant="ghost" loading={busy} onClick={() => durumDegistir(t, "PASIF")}>Pasife Al</Button>}
                  {t.durum !== "ARSIV" && <Button size="sm" variant="ghost" loading={busy} onClick={() => durumDegistir(t, "ARSIV")} aria-label={`${t.baslik} arşivle`}><Archive size={13} /></Button>}
                  <Link href={`/panel/admin/form-yonetimi/veri-tablosu/${t.id}/sonuclar`}><Button size="sm" variant="secondary"><BarChart3 size={13} />Kayıtlar ({t._count.kayitlar})</Button></Link>
                  <Button size="sm" variant="ghost" onClick={() => setSilinecek(t)} aria-label={`${t.baslik} sil`}><Trash2 size={13} className="text-red-600" /></Button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      <ConfirmDialog
        open={!!silinecek}
        onClose={() => setSilinecek(null)}
        onConfirm={handleSil}
        title="Veri Tablosunu Sil"
        message={silinecek ? `"${silinecek.baslik}" tablosu ve girilmiş ${silinecek._count.kayitlar} kayıt kalıcı olarak silinecek. Bu işlem geri alınamaz.` : ""}
        confirmLabel="Sil"
        danger
        loading={deleting}
      />
    </div>
  );
}
