"use client";

/**
 * Form Yönetimi — yönetici form listesi.
 * Formları kart listesi halinde gösterir; yayınlama/kapatma, silme
 * ve düzenleme/sonuç ekranlarına geçiş aksiyonlarını sunar.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, BarChart3, Trash2, FileText, Table2, LayoutTemplate, Archive, Power, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatDateTR } from "@/lib/format";
import { stripTags } from "@/lib/sanitize-html";
import { VeriTabloListClient } from "./VeriTabloListClient";
import { SablonListClient } from "./SablonListClient";

type Durum = "TASLAK" | "YAYINDA" | "KAPALI" | "PASIF" | "ARSIV";
type DurumFiltre = "AKTIF" | "TASLAK" | "PASIF" | "ARSIV" | "HEPSI";

interface FormOzet {
  id: string;
  baslik: string;
  aciklama?: string | null;
  durum: Durum;
  hedefBolge: boolean;
  hedefIl: boolean;
  sistemEgitim: boolean;
  sistemUniversite: boolean;
  sistemLise: boolean;
  createdByName: string;
  createdAt: string;
  /** Üni/Lise Gençlik sorumlusu yalnız kendi formunu düzenleyebilir (API'den gelir) */
  duzenlenebilir?: boolean;
  _count: { yanitlar: number; sorular: number };
}

const DURUM_BADGE: Record<Durum, { label: string; tone: "neutral" | "success" | "danger" | "warning" }> = {
  TASLAK:  { label: "Taslak",  tone: "neutral" },
  YAYINDA: { label: "Yayında", tone: "success" },
  KAPALI:  { label: "Kapalı",  tone: "danger" },
  PASIF:   { label: "Pasif",   tone: "warning" },
  ARSIV:   { label: "Arşiv",   tone: "neutral" },
};

const DURUM_FILTRELER: { key: DurumFiltre; label: string }[] = [
  { key: "AKTIF",  label: "Aktif" },
  { key: "TASLAK", label: "Taslak" },
  { key: "PASIF",  label: "Pasif / Kapalı" },
  { key: "ARSIV",  label: "Arşiv" },
  { key: "HEPSI",  label: "Tümü" },
];

function durumFiltreUygula(f: FormOzet, filtre: DurumFiltre): boolean {
  if (filtre === "HEPSI") return true;
  if (filtre === "AKTIF") return f.durum === "YAYINDA";
  if (filtre === "TASLAK") return f.durum === "TASLAK";
  if (filtre === "PASIF") return f.durum === "PASIF" || f.durum === "KAPALI";
  return f.durum === "ARSIV";
}

function hedefRozetleri(f: FormOzet): string[] {
  const roller =
    f.hedefBolge && f.hedefIl ? ["Bölge + İl Sorumluları"] :
    f.hedefBolge ? ["Bölge Sorumluları"] :
    f.hedefIl ? ["İl Sorumluları"] : [];
  return roller;
}

function sistemRozetleri(f: FormOzet): string[] {
  const s: string[] = [];
  if (f.sistemEgitim) s.push("Eğitim");
  if (f.sistemUniversite) s.push("Üniversite");
  if (f.sistemLise) s.push("Lise");
  return s;
}

export function FormListClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [silinecek, setSilinecek] = useState<FormOzet | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  // İçerik türü sekmesi — Veri Toplama Merkezi geliştirmesi (Form mevcut akış; diğerleri sonraki fazlar)
  const [tur, setTur] = useState<"FORM" | "VERI_TABLOSU" | "SABLON">("FORM");
  const [durumFiltre, setDurumFiltre] = useState<DurumFiltre>("AKTIF");

  const { data: formlar = [], isLoading } = useQuery({
    queryKey: ["formlar"],
    queryFn: async (): Promise<FormOzet[]> => {
      const res = await fetch("/api/formlar");
      if (!res.ok) throw new Error("Formlar yüklenemedi.");
      return res.json();
    },
  });

  async function durumDegistir(f: FormOzet, durum: Durum) {
    setBusyId(f.id);
    try {
      const res = await fetch(`/api/formlar/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast({ type: "error", title: "Durum güncellenemedi", message: d?.error });
        return;
      }
      toast({
        type: "success",
        title:
          durum === "YAYINDA" ? "Form yayınlandı" :
          durum === "PASIF" ? "Form pasife alındı" :
          durum === "ARSIV" ? "Form arşivlendi" : "Form kapatıldı",
        message: f.baslik,
      });
      queryClient.invalidateQueries({ queryKey: ["formlar"] });
    } catch {
      toast({ type: "error", title: "Bağlantı hatası" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleSil() {
    if (!silinecek) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/formlar/${silinecek.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast({ type: "error", title: "Form silinemedi", message: d?.error });
        return;
      }
      toast({ type: "success", title: "Form silindi", message: silinecek.baslik });
      setSilinecek(null);
      queryClient.invalidateQueries({ queryKey: ["formlar"] });
    } catch {
      toast({ type: "error", title: "Bağlantı hatası" });
    } finally {
      setDeleting(false);
    }
  }

  const gosterilenFormlar = formlar.filter(f => durumFiltreUygula(f, durumFiltre));

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="sv-page-header flex flex-wrap items-start justify-between gap-3" style={{ marginBottom: 0 }}>
        <div>
          <h1>Form Yönetimi</h1>
          <p>Veri Toplama Merkezi — form, veri tablosu ve şablonlarla bölge/il sorumlularından veri toplayın</p>
        </div>
        {tur === "FORM" && (
          <Link href="/panel/admin/form-yonetimi/yeni">
            <Button>
              <Plus size={15} />
              Yeni Form
            </Button>
          </Link>
        )}
      </div>

      {/* İçerik türü seçimi */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "FORM", label: "Form", icon: FileText },
          { key: "VERI_TABLOSU", label: "Veri Tablosu", icon: Table2 },
          { key: "SABLON", label: "Şablon", icon: LayoutTemplate },
        ] as const).map(t => {
          const aktif = tur === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTur(t.key)}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13.5px] font-bold transition"
              style={aktif
                ? { background: "var(--green-primary)", borderColor: "var(--green-primary)", color: "#fff" }
                : { background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tur === "FORM" && (isLoading ? (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="sv-section p-5 space-y-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-80" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      ) : formlar.length === 0 ? (
        <div className="sv-section px-6 py-16 text-center">
          <FileText size={32} className="mx-auto text-muted mb-3" aria-hidden="true" />
          <p className="text-[14.5px] font-semibold text-heading">Henüz form oluşturulmamış</p>
          <p className="text-[13px] text-muted mt-1 mb-5">
            İlk formunuzu oluşturup bölge ve il sorumlularıyla paylaşın.
          </p>
          <Link href="/panel/admin/form-yonetimi/yeni">
            <Button>
              <Plus size={15} />
              Yeni Form
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Durum filtresi (Aktif / Taslak / Pasif / Arşiv) */}
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
          {gosterilenFormlar.length === 0 ? (
            <div className="sv-section px-6 py-10 text-center">
              <p className="text-[13px] text-muted">Bu filtreye uygun form yok.</p>
            </div>
          ) : gosterilenFormlar.map(f => {
            const durum = DURUM_BADGE[f.durum];
            const busy = busyId === f.id;
            const yetkili = f.duzenlenebilir !== false; // sistem sorumlusu başkasının formunu yalnız görüntüler
            return (
              <div key={f.id} className="sv-section p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-bold text-heading">{f.baslik}</h2>
                      <Badge tone={durum.tone}>{durum.label}</Badge>
                    </div>
                    {f.aciklama && (
                      <p className="text-[13px] text-muted mt-1 line-clamp-2">{stripTags(f.aciklama)}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <Badge tone="neutral">{f._count.sorular} soru</Badge>
                      <Badge tone="neutral">{f._count.yanitlar} yanıt</Badge>
                      {hedefRozetleri(f).map(r => <Badge key={r} tone="info">{r}</Badge>)}
                      {sistemRozetleri(f).map(s => <Badge key={s} tone="brand">{s}</Badge>)}
                    </div>
                    <p className="text-[12px] text-muted mt-2.5">
                      {f.createdByName} · {formatDateTR(f.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Link href={`/panel/admin/form-yonetimi/${f.id}`}>
                      <Button size="sm" variant="secondary">
                        {yetkili ? <><Pencil size={13} />Düzenle</> : <><Eye size={13} />Görüntüle</>}
                      </Button>
                    </Link>
                    {yetkili && f.durum === "TASLAK" && (
                      <Button size="sm" loading={busy} onClick={() => durumDegistir(f, "YAYINDA")}>
                        Yayınla
                      </Button>
                    )}
                    {yetkili && f.durum === "YAYINDA" && (
                      <Button size="sm" variant="secondary" loading={busy} onClick={() => durumDegistir(f, "KAPALI")}>
                        Kapat
                      </Button>
                    )}
                    {yetkili && (f.durum === "KAPALI" || f.durum === "PASIF" || f.durum === "ARSIV") && (
                      <Button size="sm" variant="outline" loading={busy} onClick={() => durumDegistir(f, "YAYINDA")}>
                        <Power size={13} />
                        Aktifleştir
                      </Button>
                    )}
                    {yetkili && f.durum === "YAYINDA" && (
                      <Button size="sm" variant="ghost" loading={busy} onClick={() => durumDegistir(f, "PASIF")}>
                        Pasife Al
                      </Button>
                    )}
                    {yetkili && f.durum !== "ARSIV" && (
                      <Button size="sm" variant="ghost" loading={busy} onClick={() => durumDegistir(f, "ARSIV")} aria-label={`${f.baslik} formunu arşivle`}>
                        <Archive size={13} />
                      </Button>
                    )}
                    <Link href={`/panel/admin/form-yonetimi/${f.id}/sonuclar`}>
                      <Button size="sm" variant="secondary">
                        <BarChart3 size={13} />
                        Sonuçlar ({f._count.yanitlar})
                      </Button>
                    </Link>
                    {yetkili && (
                      <Button size="sm" variant="ghost" onClick={() => setSilinecek(f)} aria-label={`${f.baslik} formunu sil`}>
                        <Trash2 size={13} className="text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {tur === "VERI_TABLOSU" && <VeriTabloListClient />}

      {tur === "SABLON" && <SablonListClient />}

      <ConfirmDialog
        open={!!silinecek}
        onClose={() => setSilinecek(null)}
        onConfirm={handleSil}
        title="Formu Sil"
        message={
          silinecek
            ? `"${silinecek.baslik}" formu kalıcı olarak silinecek. Bu işlemle birlikte forma verilmiş ${silinecek._count.yanitlar} yanıt da silinir. Bu işlem geri alınamaz.`
            : ""
        }
        confirmLabel="Sil"
        danger
        loading={deleting}
      />
    </div>
  );
}
