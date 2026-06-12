"use client";

import { useEffect, useState, useCallback } from "react";
import type { HedefMetrik } from "@/lib/genclik-hedef";

interface Entity { id: string; ad: string; no?: number }

const DONEMLER = [
  { v: "DONEM_1", l: "1. Dönem" },
  { v: "DONEM_2", l: "2. Dönem" },
  { v: "YAZ_DONEMI", l: "Yaz Dönemi" },
];

const selectCls = "rounded-xl border px-3 py-2 text-[13px] font-bold focus:outline-none";
const selectSty = { background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" } as const;

export function GenclikHedefEditor({
  baslik, altBaslik, sistem, scope, entities, metrikler, yillar, bolgeId, sekmeler,
}: {
  baslik: string;
  altBaslik: string;
  sistem: "UNIVERSITE" | "LISE";
  scope: "bolge" | "il";
  entities: Entity[];
  metrikler: HedefMetrik[];
  yillar: number[];
  bolgeId?: string;
  sekmeler?: React.ReactNode;
}) {
  const [yil, setYil]     = useState(yillar[0] ?? new Date().getFullYear());
  const [donem, setDonem] = useState("DONEM_1");
  // entityId -> (metrikKey -> value)
  const [data, setData]   = useState<Record<string, Record<string, number>>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ sistem, yil: String(yil), donem, scope });
      if (scope === "il" && bolgeId) qs.set("bolgeId", bolgeId);
      const res = await fetch(`/api/genclik-hedefler?${qs}`).then(r => r.json());
      const rows: { bolgeId?: string; ilId?: string; hedefler: Record<string, number> }[] =
        Array.isArray(res) ? res : [];
      const map: Record<string, Record<string, number>> = {};
      for (const row of rows) {
        const eid = scope === "bolge" ? row.bolgeId! : row.ilId!;
        map[eid] = { ...(row.hedefler ?? {}) };
      }
      setData(map);
      setDirty(new Set());
    } finally {
      setLoading(false);
    }
  }, [sistem, yil, donem, scope, bolgeId]);

  useEffect(() => { load(); }, [load]);

  const setVal = (eid: string, key: string, v: string) => {
    const n = Math.max(0, Math.floor(Number(v) || 0));
    setData(prev => ({ ...prev, [eid]: { ...(prev[eid] ?? {}), [key]: n } }));
    setDirty(prev => new Set(prev).add(eid));
  };

  const save = async (eid: string) => {
    setSavingId(eid);
    try {
      const res = await fetch("/api/genclik-hedefler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, sistem, id: eid, yil, donem, hedefler: data[eid] ?? {} }),
      });
      if (res.ok) {
        showToast("Murad kaydedildi");
        setDirty(prev => { const s = new Set(prev); s.delete(eid); return s; });
      } else {
        const d = await res.json().catch(() => ({}));
        showToast("Hata: " + (d.error ?? "kaydedilemedi"));
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{toast}</div>
      )}

      <div className="sv-page-header">
        <h1>{baslik}</h1>
        <p>{altBaslik}</p>
      </div>

      {sekmeler}

      <div className="flex flex-wrap items-end gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Yıl</span>
          <select value={yil} onChange={e => setYil(Number(e.target.value))} className={selectCls} style={selectSty}>
            {(yillar.includes(yil) ? yillar : [yil, ...yillar]).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dönem</span>
          <select value={donem} onChange={e => setDonem(e.target.value)} className={selectCls} style={selectSty}>
            {DONEMLER.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
          </select>
        </label>
      </div>

      <div className="sv-section">
        <div className="px-5 py-3 border-b flex items-center justify-between gap-2" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {scope === "bolge" ? "Bölge Muradları" : "İl Muradları"} — {yil} / {DONEMLER.find(d => d.v === donem)?.l}
          </h2>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>← yatay kaydırın →</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-muted text-sm">Yükleniyor...</div>
        ) : entities.length === 0 ? (
          <div className="p-10 text-center text-muted text-sm">Kayıt bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-max min-w-full text-sm">
              <thead style={{ background: "var(--bg-th)" }}>
                <tr>
                  <th className="px-3 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide whitespace-nowrap sticky left-0 z-10"
                    style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)", background: "var(--bg-th)" }}>
                    {scope === "bolge" ? "Bölge" : "İl"}
                  </th>
                  {metrikler.map(m => (
                    <th key={m.key} className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: m.renk, borderBottom: "1px solid var(--border)", minWidth: 84 }}>{m.label}</th>
                  ))}
                  <th className="px-3 py-2.5 text-center text-[10.5px] font-bold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {entities.map(ent => (
                  <tr key={ent.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2 font-bold whitespace-nowrap sticky left-0 z-10"
                      style={{ color: "var(--text-primary)", background: "var(--bg-card)" }}>
                      {ent.no != null ? `${ent.no}. Bölge` : ent.ad}
                    </td>
                    {metrikler.map(m => (
                      <td key={m.key} className="px-1.5 py-1.5 text-center">
                        <input
                          type="number" min={0}
                          value={data[ent.id]?.[m.key] ?? ""}
                          onChange={e => setVal(ent.id, m.key, e.target.value)}
                          className="w-16 text-center rounded-lg border px-1.5 py-1 text-[13px] focus:outline-none"
                          style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={() => save(ent.id)}
                        disabled={savingId === ent.id || !dirty.has(ent.id)}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition disabled:opacity-40"
                        style={{ background: "var(--green-primary)" }}>
                        {savingId === ent.id ? "..." : "Kaydet"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
