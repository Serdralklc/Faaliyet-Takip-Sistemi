"use client";

/** Denetim logları filtre çubuğu — searchParams tabanlı sunucu filtrelemesini sürer */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Props {
  actionOptions: { value: string; label: string }[];
  initial: { islem?: string; kullanici?: string; baslangic?: string; bitis?: string };
}

export function LogFilters({ actionOptions, initial }: Props) {
  const router = useRouter();
  const [islem, setIslem] = useState(initial.islem ?? "");
  const [kullanici, setKullanici] = useState(initial.kullanici ?? "");
  const [baslangic, setBaslangic] = useState(initial.baslangic ?? "");
  const [bitis, setBitis] = useState(initial.bitis ?? "");

  const hasActive = !!(initial.islem || initial.kullanici || initial.baslangic || initial.bitis);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (islem) params.set("islem", islem);
    if (kullanici.trim()) params.set("kullanici", kullanici.trim());
    if (baslangic) params.set("baslangic", baslangic);
    if (bitis) params.set("bitis", bitis);
    router.push(`/panel/admin/loglar${params.size ? `?${params}` : ""}`);
  }

  function clear() {
    setIslem(""); setKullanici(""); setBaslangic(""); setBitis("");
    router.push("/panel/admin/loglar");
  }

  const fieldCls =
    "rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition";

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-2.5 px-4 py-3 border-b border-border">
      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Kullanıcı</span>
        <input
          type="text"
          value={kullanici}
          onChange={e => setKullanici(e.target.value)}
          placeholder="Ad veya e-posta"
          className={`${fieldCls} w-44`}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">İşlem Tipi</span>
        <select value={islem} onChange={e => setIslem(e.target.value)} className={`${fieldCls} w-48`}>
          <option value="">Tümü</option>
          {actionOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Başlangıç</span>
        <input type="date" value={baslangic} onChange={e => setBaslangic(e.target.value)} className={fieldCls} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Bitiş</span>
        <input type="date" value={bitis} onChange={e => setBitis(e.target.value)} className={fieldCls} />
      </label>
      <Button type="submit" size="sm">Filtrele</Button>
      {hasActive && (
        <Button type="button" size="sm" variant="ghost" onClick={clear}>Temizle</Button>
      )}
    </form>
  );
}
