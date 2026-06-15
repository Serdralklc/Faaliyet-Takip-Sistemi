"use client";

import { Input, Textarea, Select } from "@/components/ui/Input";

export interface OzelAlanDefUI {
  kod: string;
  ad: string;
  tip: string;
  kategoriKodu: string;
  zorunlu: boolean;
  sira: number;
  secenekler: string[];
  aktif: boolean;
}

/**
 * Gençlik giriş formunda kategoriye bağlı özel alanları (Faz 3) render eder.
 * Cevaplar { [kod]: değer } olarak tutulur; faaliyetin ozelAlanlar JSON'una yazılır.
 */
export function OzelAlanlarGirisi({ defs, values, onChange }: {
  defs: OzelAlanDefUI[];
  values: Record<string, unknown>;
  onChange: (kod: string, val: unknown) => void;
}) {
  if (!defs.length) return null;
  return (
    <div className="space-y-4 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-hover)" }}>
      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        Bu kategoriye özel alanlar
      </p>
      {defs.map(d => {
        const v = (values[d.kod] as string) ?? "";
        const label = d.zorunlu ? `${d.ad} *` : d.ad;
        if (d.tip === "UZUN_METIN")
          return <Textarea key={d.kod} label={label} rows={2} value={v} onChange={e => onChange(d.kod, e.target.value)} />;
        if (d.tip === "SAYI")
          return <Input key={d.kod} label={label} type="number" min={0} value={v} onChange={e => onChange(d.kod, e.target.value)} />;
        if (d.tip === "TARIH")
          return <Input key={d.kod} label={label} type="date" value={v} onChange={e => onChange(d.kod, e.target.value)} />;
        if (d.tip === "EVET_HAYIR")
          return (
            <Select key={d.kod} label={label} value={v} onChange={e => onChange(d.kod, e.target.value)}>
              <option value="">Seçiniz</option>
              <option value="Evet">Evet</option>
              <option value="Hayır">Hayır</option>
            </Select>
          );
        if (d.tip === "TEK_SECIM")
          return (
            <Select key={d.kod} label={label} value={v} onChange={e => onChange(d.kod, e.target.value)}>
              <option value="">Seçiniz</option>
              {d.secenekler.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          );
        return <Input key={d.kod} label={label} value={v} onChange={e => onChange(d.kod, e.target.value)} />;
      })}
    </div>
  );
}
