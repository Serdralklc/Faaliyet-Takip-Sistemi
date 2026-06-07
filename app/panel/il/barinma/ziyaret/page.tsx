"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Check, X } from "lucide-react";

interface HousingUnit { id: string; ad: string; tip: string }
interface Visit {
  id: string; housingUnitId: string; tarih: string;
  ziyaretEden: string; notlar: string | null;
  housingUnit?: { ad: string; tip: string };
}

const TIP_COLOR: Record<string, string> = { EV: "#006B3F", APART: "#0369A1", YURT: "#7C3AED" };

function AddVisitForm({ units, onAdd }: { units: HousingUnit[]; onAdd: (v: Visit) => void }) {
  const [show, setShow] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    housingUnitId: units[0]?.id ?? "",
    tarih: today,
    ziyaretEden: "",
    notlar: "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ziyaretEden.trim() || !form.housingUnitId) return;
    setLoading(true);
    const res = await fetch("/api/housing-visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      onAdd(await res.json());
      setShow(false);
      setForm({ housingUnitId: units[0]?.id ?? "", tarih: today, ziyaretEden: "", notlar: "" });
    }
    setLoading(false);
  }

  if (!show) {
    return (
      <button onClick={() => setShow(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ background: "var(--green-primary)" }}>
        <Plus size={15} /> Ziyaret Ekle
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="sv-section p-5 space-y-4">
      <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Yeni Ziyaret Kaydı</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Ev/Apart/Yurt
          </label>
          <select value={form.housingUnitId} onChange={e => setForm(p => ({ ...p, housingUnitId: e.target.value }))}
            className="w-full border-2 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
            {units.map(u => <option key={u.id} value={u.id}>{u.ad}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Tarih
          </label>
          <input type="date" value={form.tarih} onChange={e => setForm(p => ({ ...p, tarih: e.target.value }))}
            className="w-full border-2 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Ziyaret Eden
          </label>
          <input autoFocus value={form.ziyaretEden} onChange={e => setForm(p => ({ ...p, ziyaretEden: e.target.value }))}
            placeholder="Ad Soyad"
            className="w-full border-2 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Notlar (opsiyonel)
        </label>
        <input value={form.notlar} onChange={e => setForm(p => ({ ...p, notlar: e.target.value }))}
          placeholder="Ziyaret notları..."
          className="w-full border-2 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "var(--green-primary)" }}>
          <Check size={14} /> {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button type="button" onClick={() => setShow(false)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <X size={14} /> İptal
        </button>
      </div>
    </form>
  );
}

export default function ZiyaretPage() {
  const { data: session } = useSession();
  const [units, setUnits] = useState<HousingUnit[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  const ilId = session?.user?.activeIlId;

  async function load() {
    if (!ilId) return;
    const [u, v] = await Promise.all([
      fetch(`/api/housing-units?ilId=${ilId}`).then(r => r.json()),
      fetch(`/api/housing-visits?ilId=${ilId}`).then(r => r.json()),
    ]);
    setUnits(u);
    setVisits(v);
  }

  useEffect(() => { load(); }, [ilId]);

  async function handleDelete(id: string) {
    if (!confirm("Bu ziyareti silmek istiyor musunuz?")) return;
    await fetch(`/api/housing-visits?id=${id}`, { method: "DELETE" });
    setVisits(p => p.filter(v => v.id !== id));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="sv-page-header">
        <h1>Ziyaret Kayıtları</h1>
        <p>Ev, apart ve yurt ziyaret geçmişini buradan takip edin</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          Toplam {visits.length} ziyaret kaydı
        </span>
        {units.length > 0 && <AddVisitForm units={units} onAdd={v => setVisits(p => [v, ...p])} />}
      </div>

      {units.length === 0 && (
        <div className="sv-section p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Önce Ev/Apart/Yurt sayfasından barınma birimi eklemeniz gerekmektedir.
          </p>
        </div>
      )}

      {units.length > 0 && visits.length === 0 && (
        <div className="sv-section p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Henüz ziyaret kaydı eklenmemiş.
          </p>
        </div>
      )}

      {visits.length > 0 && (
        <div className="sv-section overflow-hidden">
          <div className="sv-section-header">
            <h2>Ziyaret Panosu</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--bg-th)" }}>
                {["Tarih", "Ev/Apart/Yurt", "Ziyaret Eden", "Notlar", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {visits.map(v => {
                const unit = v.housingUnit ?? units.find(u => u.id === v.housingUnitId);
                return (
                  <tr key={v.id} className="hover:bg-[color:var(--bg-hover)] transition group">
                    <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap"
                      style={{ color: "var(--text-primary)" }}>
                      {formatDate(v.tarih)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${TIP_COLOR[unit?.tip ?? "EV"]}18`,
                          color: TIP_COLOR[unit?.tip ?? "EV"],
                        }}>
                        {unit?.ad ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      {v.ziyaretEden}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                      {v.notlar ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(v.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
