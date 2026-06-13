"use client";

/**
 * PDF / Excel / Word indirme butonları — tüm rapor ekranlarında kullanılır.
 * getSpec, butona basıldığı andaki (filtrelenmiş) veriyi döndürmelidir.
 */

import { useState } from "react";
import { FileText, FileSpreadsheet, FileType } from "lucide-react";
import { Button } from "./Button";
import { useToast } from "./Toast";
import type { ExportSpec, CombinedSpec } from "@/lib/export/corporate";

type Format = "pdf" | "excel" | "word";

const FORMATS: { key: Format; label: string; icon: typeof FileText }[] = [
  { key: "pdf",   label: "PDF",   icon: FileText },
  { key: "excel", label: "Excel", icon: FileSpreadsheet },
  { key: "word",  label: "Word",  icon: FileType },
];

export function ExportButtons({ getSpec, size = "sm" }: { getSpec: () => ExportSpec; size?: "sm" | "md" }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<Format | null>(null);

  async function run(format: Format) {
    setBusy(format);
    try {
      const spec = getSpec();
      if (!spec.rows.length) {
        toast({ type: "warning", title: "Dışa aktarılacak kayıt yok" });
        return;
      }
      const mod = await import("@/lib/export/corporate");
      if (format === "pdf") await mod.exportPdf(spec);
      else if (format === "excel") await mod.exportExcel(spec);
      else await mod.exportWord(spec);
      toast({ type: "success", title: `${format.toUpperCase()} indirildi`, message: `${spec.rows.length} kayıt dışa aktarıldı.` });
    } catch (e) {
      console.error("Export hatası:", e);
      toast({ type: "error", title: "Dışa aktarma başarısız", message: "Lütfen tekrar deneyin." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Raporu dışa aktar">
      {FORMATS.map(f => {
        const Icon = f.icon;
        return (
          <Button
            key={f.key}
            size={size}
            variant="secondary"
            loading={busy === f.key}
            disabled={busy !== null && busy !== f.key}
            onClick={() => run(f.key)}
            title={`${f.label} olarak indir`}
          >
            {busy !== f.key && <Icon size={13} />}
            {f.label}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Birleşik (çok bölümlü) dışa aktarma — Genel Rapor için. Seçili birimleri
 * tek dosyada üst üste bölümler hâlinde verir.
 */
export function CombinedExportButtons({ getSpec, size = "sm", renk }: {
  getSpec: () => CombinedSpec; size?: "sm" | "md"; renk?: string;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<Format | null>(null);

  async function run(format: Format) {
    setBusy(format);
    try {
      const spec = getSpec();
      const toplam = spec.sections.reduce((s, sec) => s + sec.rows.length, 0);
      if (toplam === 0) {
        toast({ type: "warning", title: "Dışa aktarılacak kayıt yok" });
        return;
      }
      const mod = await import("@/lib/export/corporate");
      if (format === "pdf") await mod.exportCombinedPdf(spec);
      else if (format === "excel") await mod.exportCombinedExcel(spec);
      else await mod.exportCombinedWord(spec);
      toast({ type: "success", title: `${format.toUpperCase()} indirildi`, message: `${spec.sections.length} birim • ${toplam} kayıt` });
    } catch (e) {
      console.error("Birleşik export hatası:", e);
      toast({ type: "error", title: "Dışa aktarma başarısız", message: "Lütfen tekrar deneyin." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Genel raporu dışa aktar">
      {FORMATS.map(f => {
        const Icon = f.icon;
        const isPdf = f.key === "pdf";
        return (
          <button
            key={f.key}
            disabled={busy !== null && busy !== f.key}
            onClick={() => run(f.key)}
            title={`Genel raporu ${f.label} olarak indir`}
            className={`inline-flex items-center gap-1.5 rounded-lg font-bold transition active:scale-[0.98] disabled:opacity-50 ${size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-[13px]"}`}
            style={isPdf
              ? { background: renk ?? "#0B6B3A", color: "#fff", boxShadow: `0 2px 8px ${(renk ?? "#0B6B3A")}40` }
              : { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            {busy === f.key ? <span className="animate-pulse">…</span> : <Icon size={14} />}
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
