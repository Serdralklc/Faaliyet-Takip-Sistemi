"use client";

/**
 * PDF / Excel / Word indirme butonları — tüm rapor ekranlarında kullanılır.
 * getSpec, butona basıldığı andaki (filtrelenmiş) veriyi döndürmelidir.
 */

import { useState } from "react";
import { FileText, FileSpreadsheet, FileType } from "lucide-react";
import { Button } from "./Button";
import { useToast } from "./Toast";
import type { ExportSpec } from "@/lib/export/corporate";

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
