"use client";

/** Form Yönetimi → "Şablon" sekmesi: hazır form/veri tablosu şablonlarını listeler, siler, şablondan oluşturur. */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, LayoutTemplate, FileText, Table2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatDateTR } from "@/lib/format";

interface Sablon {
  id: string;
  ad: string;
  aciklama?: string | null;
  tur: "FORM" | "VERI_TABLOSU";
  icerik: { sorular?: unknown[]; sutunlar?: unknown[] };
  createdByName: string;
  createdAt: string;
}

function ogeSayisi(s: Sablon): number {
  return s.icerik?.sorular?.length ?? s.icerik?.sutunlar?.length ?? 0;
}

export function SablonListClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [silinecek, setSilinecek] = useState<Sablon | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: sablonlar = [], isLoading } = useQuery({
    queryKey: ["sablonlar"],
    queryFn: async (): Promise<Sablon[]> => {
      const res = await fetch("/api/sablonlar");
      if (!res.ok) throw new Error("Şablonlar yüklenemedi.");
      return res.json();
    },
  });

  async function handleSil() {
    if (!silinecek) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sablonlar/${silinecek.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => null); toast({ type: "error", title: "Silinemedi", message: d?.error }); return; }
      toast({ type: "success", title: "Şablon silindi", message: silinecek.ad });
      setSilinecek(null);
      queryClient.invalidateQueries({ queryKey: ["sablonlar"] });
    } catch { toast({ type: "error", title: "Bağlantı hatası" }); } finally { setDeleting(false); }
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted">
        Şablonlar, sık kullanılan form/veri tablosu iskeletleridir. Bir formu veya veri tablosunu hazırlarken
        <strong> “Şablon Olarak Kaydet”</strong> ile şablon oluşturabilir; buradan tek tıkla yeni içerik üretebilirsiniz.
      </p>

      {isLoading ? (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="sv-section p-5 space-y-3"><Skeleton className="h-4 w-56" /><Skeleton className="h-3 w-40" /></div>)}
        </div>
      ) : sablonlar.length === 0 ? (
        <div className="sv-section px-6 py-16 text-center">
          <LayoutTemplate size={32} className="mx-auto text-muted mb-3" aria-hidden="true" />
          <p className="text-[14.5px] font-semibold text-heading">Henüz şablon yok</p>
          <p className="text-[13px] text-muted mt-1 max-w-md mx-auto">
            Bir form veya veri tablosu hazırlayıp “Şablon Olarak Kaydet” ile ilk şablonunuzu oluşturun
            (ör. Mezun Takip, Öğrenci Evi, Kafile Katılım…).
          </p>
        </div>
      ) : (
        sablonlar.map(s => {
          const tabloMu = s.tur === "VERI_TABLOSU";
          const olusturHref = tabloMu
            ? `/panel/admin/form-yonetimi/veri-tablosu/yeni?sablon=${s.id}`
            : `/panel/admin/form-yonetimi/yeni?sablon=${s.id}`;
          return (
            <div key={s.id} className="sv-section p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-bold text-heading">{s.ad}</h2>
                    <Badge tone={tabloMu ? "info" : "brand"}>{tabloMu ? "Veri Tablosu" : "Form"}</Badge>
                  </div>
                  {s.aciklama && <p className="text-[13px] text-muted mt-1 line-clamp-2">{s.aciklama}</p>}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <Badge tone="neutral">{ogeSayisi(s)} {tabloMu ? "sütun" : "soru"}</Badge>
                  </div>
                  <p className="text-[12px] text-muted mt-2.5">{s.createdByName} · {formatDateTR(s.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <Link href={olusturHref}>
                    <Button size="sm">
                      {tabloMu ? <Table2 size={13} /> : <FileText size={13} />}
                      Bu Şablondan Oluştur <ArrowRight size={13} />
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => setSilinecek(s)} aria-label={`${s.ad} sil`}><Trash2 size={13} className="text-red-600" /></Button>
                </div>
              </div>
            </div>
          );
        })
      )}

      <ConfirmDialog
        open={!!silinecek}
        onClose={() => setSilinecek(null)}
        onConfirm={handleSil}
        title="Şablonu Sil"
        message={silinecek ? `"${silinecek.ad}" şablonu silinecek. Bu şablondan üretilmiş mevcut form/tablolar etkilenmez.` : ""}
        confirmLabel="Sil"
        danger
        loading={deleting}
      />
    </div>
  );
}
