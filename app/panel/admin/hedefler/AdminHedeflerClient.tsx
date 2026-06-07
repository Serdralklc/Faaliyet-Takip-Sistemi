"use client";

import { useState } from "react";
import { Check, X, Pencil, Trash2, Plus, ChevronDown } from "lucide-react";

/* ─── Tipler ─── */
interface IlHedef {
  id: string; ilId: string; yil: number; donem: string;
  yeniIntisap: number; sosyalFaaliyet: number; kafile: number;
  sabahNamazi: number; ilimDersi: number; kykBulusma: number; ziyaret: number;
  il: { id: string; ad: string };
}
interface BolgeHedef {
  id: string; bolgeId: string; yil: number; donem: string;
  yeniIntisap: number; sosyalFaaliyet: number; kafile: number;
  sabahNamazi: number; ilimDersi: number; kykBulusma: number; ziyaret: number;
  ilHedef: IlHedef[];
}
interface BolgeWithHedef {
  id: string; no: number; ad: string;
  hedefler: BolgeHedef[];
  iller: { id: string; ad: string }[];
}

/* ─── Sabitler ─── */
const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

const HEDEF_ALANLARI = [
  { key: "yeniIntisap",    label: "Yeni İntisap" },
  { key: "sosyalFaaliyet", label: "Sosyal Faaliyet" },
  { key: "kafile",         label: "Kafile" },
  { key: "sabahNamazi",    label: "Sabah Namazı" },
  { key: "ilimDersi",      label: "İlim Dersi" },
  { key: "kykBulusma",     label: "KYK Buluşması" },
  { key: "ziyaret",        label: "Ziyaret" },
] as const;

type HedefKey = typeof HEDEF_ALANLARI[number]["key"];

const EMPTY_HEDEF = Object.fromEntries(HEDEF_ALANLARI.map(a => [a.key, 0])) as Record<HedefKey, number>;

function scoreColor(pct: number) {
  if (pct >= 90) return "#059669";
  if (pct >= 70) return "#D9BC4B";
  return "#DC2626";
}

/* ─── Hedef Formu ─── */
function HedefForm({
  initial, yil, donem, onSave, onCancel, title,
}: {
  initial: Record<HedefKey, number>;
  yil: number; donem: string;
  onSave: (vals: Record<HedefKey, number>) => Promise<void>;
  onCancel: () => void;
  title: string;
}) {
  const [vals, setVals] = useState({ ...initial });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSave(vals);
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="border rounded-2xl p-5 space-y-4"
      style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
      <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {HEDEF_ALANLARI.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-[10px] font-bold uppercase tracking-wide mb-1"
              style={{ color: "var(--text-muted)" }}>{label}</label>
            <input
              type="number" min={0} value={vals[key]}
              onChange={e => setVals(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
              onFocus={e => { if (e.target.value === "0") e.target.select(); }}
              className="w-full border-2 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "var(--green-primary)" }}>
          <Check size={14} /> {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <X size={14} /> İptal
        </button>
      </div>
    </form>
  );
}

/* ─── Bölge Kartı ─── */
function BolgeKart({ bolge, onRefresh }: { bolge: BolgeWithHedef; onRefresh: () => void }) {
  const THIS_YEAR = new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [addingHedef, setAddingHedef] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newYil, setNewYil] = useState(THIS_YEAR);
  const [newDonem, setNewDonem] = useState("DONEM_1");

  async function saveHedef(vals: Record<HedefKey, number>, hedefId?: string) {
    const body = { bolgeId: bolge.id, yil: newYil, donem: newDonem, ...vals };
    await fetch("/api/hedefler/bolge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setAddingHedef(false);
    setEditingId(null);
    onRefresh();
  }

  async function deleteHedef(id: string) {
    if (!confirm("Bu hedefi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/hedefler/bolge?id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="sv-section overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 border-b text-left transition"
        style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
            style={{ background: "var(--green-primary)" }}>
            {bolge.no}
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{bolge.ad}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{bolge.iller.length} il · {bolge.hedefler.length} hedef kaydı</p>
          </div>
        </div>
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }} />
      </button>

      {open && (
        <div className="p-5 space-y-4">
          {/* Mevcut hedefler */}
          {bolge.hedefler.map(h => (
            <div key={h.id} className="border rounded-2xl overflow-hidden"
              style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
                <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                  {h.yil} / {DONEM_LABEL[h.donem]}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => { setNewYil(h.yil); setNewDonem(h.donem); setEditingId(h.id); }}
                    className="p-1.5 rounded-lg hover:bg-[color:var(--bg-hover)] transition">
                    <Pencil size={12} style={{ color: "var(--text-muted)" }} />
                  </button>
                  <button onClick={() => deleteHedef(h.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition">
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>

              {editingId === h.id ? (
                <div className="p-4">
                  <HedefForm
                    title="Hedefi Düzenle"
                    initial={h as any}
                    yil={h.yil} donem={h.donem}
                    onSave={async (vals) => { await saveHedef(vals); }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-3">
                    {HEDEF_ALANLARI.map(({ key, label }) => (
                      <div key={key} className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-1"
                          style={{ color: "var(--text-muted)" }}>{label}</p>
                        <p className="text-lg font-black" style={{ color: "var(--green-primary)" }}>
                          {(h as any)[key]}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* İl dağılımları */}
                  {h.ilHedef.length > 0 && (
                    <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
                      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide border-b"
                        style={{ background: "var(--bg-th)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                        İl Dağılımları
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: "var(--bg-th)" }}>
                            <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--text-muted)" }}>İl</th>
                            {HEDEF_ALANLARI.map(a => (
                              <th key={a.key} className="text-center px-2 py-2 font-semibold" style={{ color: "var(--text-muted)" }}>
                                {a.label.split(" ")[0]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                          {h.ilHedef.map(ih => (
                            <tr key={ih.id} className="hover:bg-[color:var(--bg-hover)]">
                              <td className="px-3 py-2 font-semibold" style={{ color: "var(--text-primary)" }}>
                                {ih.il.ad}
                              </td>
                              {HEDEF_ALANLARI.map(a => (
                                <td key={a.key} className="text-center px-2 py-2 font-bold"
                                  style={{ color: "var(--text-secondary)" }}>
                                  {(ih as any)[a.key]}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {/* Toplam satırı */}
                          <tr style={{ background: "var(--bg-th)", fontWeight: 700 }}>
                            <td className="px-3 py-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>Dağıtılan</td>
                            {HEDEF_ALANLARI.map(a => {
                              const toplam = h.ilHedef.reduce((s, ih) => s + (ih as any)[a.key], 0);
                              const hedefVal = (h as any)[a.key];
                              const color = toplam > hedefVal ? "#DC2626" : toplam === hedefVal ? "#059669" : "#D9BC4B";
                              return (
                                <td key={a.key} className="text-center px-2 py-2 text-xs font-black"
                                  style={{ color }}>
                                  {toplam}/{hedefVal}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Yeni hedef ekle */}
          {addingHedef ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Yıl</label>
                  <select value={newYil} onChange={e => setNewYil(+e.target.value)}
                    className="border-2 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none"
                    style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
                    {[THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Dönem</label>
                  <select value={newDonem} onChange={e => setNewDonem(e.target.value)}
                    className="border-2 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none"
                    style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
                    {Object.entries(DONEM_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <HedefForm
                title={`${bolge.ad} — ${newYil} / ${DONEM_LABEL[newDonem]}`}
                initial={{ ...EMPTY_HEDEF }}
                yil={newYil} donem={newDonem}
                onSave={saveHedef}
                onCancel={() => setAddingHedef(false)}
              />
            </div>
          ) : (
            <button onClick={() => setAddingHedef(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-dashed transition"
              style={{ borderColor: "var(--green-primary)", color: "var(--green-primary)" }}>
              <Plus size={14} /> {bolge.ad} için Hedef Ekle
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Ana Component ─── */
export default function AdminHedeflerClient({ bolgeler: initial }: { bolgeler: BolgeWithHedef[] }) {
  const [bolgeler, setBolgeler] = useState(initial);

  async function refresh() {
    const res = await fetch("/api/hedefler/bolge");
    // re-fetch the page server data via router refresh trick
    window.location.reload();
  }

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="sv-page-header">
        <h1>Hedef Yönetimi</h1>
        <p>Bölgelere dönemlik hedef atayın. Bölge sorumluları bu hedefleri illerine dağıtır.</p>
      </div>

      <div className="rounded-xl p-4 border" style={{ background: "var(--gold-light)", borderColor: "#D9BC4B" }}>
        <p className="text-sm font-semibold" style={{ color: "#7A6A1A" }}>
          💡 Hedefler 7 kategori için verilebilir: Yeni İntisap, Sosyal Faaliyet, Kafile, Sabah Namazı, İlim Dersi, KYK Buluşması, Ziyaret.
          Bölge sorumluları kendi hedeflerini illerine dağıtır.
        </p>
      </div>

      <div className="space-y-4">
        {bolgeler.map(b => (
          <BolgeKart key={b.id} bolge={b} onRefresh={refresh} />
        ))}
      </div>
    </div>
  );
}
