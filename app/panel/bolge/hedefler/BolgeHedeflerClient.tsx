"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

/* ─── Tipler ─── */
interface IlHedef {
  id: string; ilId: string; yil: number; donem: string;
  yeniIntisap: number; sosyalFaaliyet: number; kafile: number;
  sabahNamazi: number; ilimDersi: number; kykBulusma: number; ziyaret: number;
  il: { id: string; ad: string };
}
interface BolgeHedef {
  id: string; yil: number; donem: string;
  yeniIntisap: number; sosyalFaaliyet: number; kafile: number;
  sabahNamazi: number; ilimDersi: number; kykBulusma: number; ziyaret: number;
  ilHedef: IlHedef[];
}

/* ─── Sabitler ─── */
const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

const HEDEF_ALANLARI = [
  { key: "yeniIntisap",    label: "Yeni İntisap",     short: "İntisap" },
  { key: "sosyalFaaliyet", label: "Sosyal Faaliyet",  short: "Faaliyet" },
  { key: "kafile",         label: "Kafile",            short: "Kafile" },
  { key: "sabahNamazi",    label: "Sabah Namazı",     short: "Sabah" },
  { key: "ilimDersi",      label: "İlim Dersi",       short: "İlim" },
  { key: "kykBulusma",     label: "KYK Buluşması",    short: "KYK" },
  { key: "ziyaret",        label: "Ziyaret",           short: "Ziyaret" },
] as const;

type HedefKey = typeof HEDEF_ALANLARI[number]["key"];

function pctColor(v: number) {
  if (v >= 90) return "#059669";
  if (v >= 70) return "#D9BC4B";
  return "#DC2626";
}

function pct(gerceklesen: number, hedef: number) {
  if (!hedef) return null;
  return Math.min(999, Math.round((gerceklesen / hedef) * 100));
}

/* ─── İl Hedef Satırı ─── */
function IlHedefRow({
  il, ilHedef, bolgeHedef, bolgeHedefId, yil, donem, onSaved,
}: {
  il: { id: string; ad: string };
  ilHedef?: IlHedef;
  bolgeHedef: BolgeHedef;
  bolgeHedefId: string;
  yil: number; donem: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [vals, setVals] = useState<Record<HedefKey, number>>(
    ilHedef
      ? { yeniIntisap: ilHedef.yeniIntisap, sosyalFaaliyet: ilHedef.sosyalFaaliyet,
          kafile: ilHedef.kafile, sabahNamazi: ilHedef.sabahNamazi,
          ilimDersi: ilHedef.ilimDersi, kykBulusma: ilHedef.kykBulusma, ziyaret: ilHedef.ziyaret }
      : { yeniIntisap: 0, sosyalFaaliyet: 0, kafile: 0, sabahNamazi: 0, ilimDersi: 0, kykBulusma: 0, ziyaret: 0 }
  );
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await fetch("/api/hedefler/il", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ilId: il.id, bolgeHedefId, yil, donem, ...vals }),
    });
    setEditing(false);
    setLoading(false);
    onSaved();
  }

  if (editing) {
    return (
      <tr style={{ background: "var(--bg-th)" }}>
        <td className="px-3 py-2 font-bold text-sm" style={{ color: "var(--text-primary)" }}>{il.ad}</td>
        {HEDEF_ALANLARI.map(a => (
          <td key={a.key} className="px-1 py-2">
            <input
              type="number" min={0} value={vals[a.key]}
              onChange={e => setVals(p => ({ ...p, [a.key]: parseInt(e.target.value) || 0 }))}
              onFocus={e => { if (e.target.value === "0") e.target.select(); }}
              className="w-16 border-2 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--green-primary)", color: "var(--text-primary)" }}
            />
          </td>
        ))}
        <td className="px-2 py-2">
          <div className="flex gap-1">
            <button onClick={save} disabled={loading}
              className="p-1.5 rounded-lg text-white"
              style={{ background: "var(--green-primary)" }}>
              <Check size={12} />
            </button>
            <button onClick={() => setEditing(false)}
              className="p-1.5 rounded-lg border"
              style={{ borderColor: "var(--border)" }}>
              <X size={12} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-[color:var(--bg-hover)] group cursor-pointer transition"
      onClick={() => setEditing(true)}>
      <td className="px-3 py-3 font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{il.ad}</td>
      {HEDEF_ALANLARI.map(a => {
        const v = ilHedef ? (ilHedef as any)[a.key] : 0;
        return (
          <td key={a.key} className="px-2 py-3 text-center">
            <span className={`text-sm font-bold ${v === 0 ? "opacity-30" : ""}`}
              style={{ color: v === 0 ? "var(--text-muted)" : "var(--text-primary)" }}>
              {v}
            </span>
          </td>
        );
      })}
      <td className="px-2 py-3">
        <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition"
          style={{ color: "var(--green-primary)" }}>Düzenle</span>
      </td>
    </tr>
  );
}

/* ─── Bölge Hedef Kartı ─── */
function BolgeHedefKart({
  hedef, iller, onRefresh,
}: {
  hedef: BolgeHedef;
  iller: { id: string; ad: string }[];
  onRefresh: () => void;
}) {
  /* Dağıtılan toplam */
  const dagitilan = HEDEF_ALANLARI.reduce((acc, a) => {
    acc[a.key] = hedef.ilHedef.reduce((s, ih) => s + (ih as any)[a.key], 0);
    return acc;
  }, {} as Record<HedefKey, number>);

  /* Genel doğrulama */
  const hatalar = HEDEF_ALANLARI.filter(a => dagitilan[a.key] > (hedef as any)[a.key]);
  const tamam   = HEDEF_ALANLARI.every(a => dagitilan[a.key] === (hedef as any)[a.key]);

  return (
    <div className="sv-section overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b"
        style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
        <div>
          <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {hedef.yil} / {DONEM_LABEL[hedef.donem]}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Bölge hedefi — İllere tıklayarak düzenleyin
          </p>
        </div>
        {tamam
          ? <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#05966920", color: "#059669" }}>✓ Dağıtım Tamamlandı</span>
          : hatalar.length > 0
          ? <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#DC262620", color: "#DC2626" }}>⚠ Hedef Aşıldı</span>
          : <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#D9BC4B20", color: "#A07A00" }}>Dağıtım Devam Ediyor</span>
        }
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
              <th className="text-left px-3 py-2.5 font-bold" style={{ color: "var(--text-muted)" }}>İl</th>
              {HEDEF_ALANLARI.map(a => (
                <th key={a.key} className="text-center px-2 py-2.5 font-bold min-w-[60px]"
                  style={{ color: "var(--text-muted)" }}>
                  {a.short}
                </th>
              ))}
              <th className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {/* Bölge hedefi (sabit) */}
            <tr style={{ background: `var(--green-light)` }}>
              <td className="px-3 py-2.5 font-black text-xs" style={{ color: "var(--green-primary)" }}>
                📊 Bölge Hedefi
              </td>
              {HEDEF_ALANLARI.map(a => (
                <td key={a.key} className="text-center px-2 py-2.5 font-black"
                  style={{ color: "var(--green-primary)" }}>
                  {(hedef as any)[a.key]}
                </td>
              ))}
              <td />
            </tr>

            {/* İller */}
            {iller.map(il => {
              const ilH = hedef.ilHedef.find(ih => ih.ilId === il.id);
              return (
                <IlHedefRow
                  key={il.id}
                  il={il}
                  ilHedef={ilH}
                  bolgeHedef={hedef}
                  bolgeHedefId={hedef.id}
                  yil={hedef.yil}
                  donem={hedef.donem}
                  onSaved={onRefresh}
                />
              );
            })}

            {/* Toplam satırı */}
            <tr className="border-t font-bold" style={{ borderColor: "var(--border)", background: "var(--bg-th)" }}>
              <td className="px-3 py-2.5 text-xs font-bold" style={{ color: "var(--text-muted)" }}>Dağıtılan Toplam</td>
              {HEDEF_ALANLARI.map(a => {
                const d = dagitilan[a.key];
                const h = (hedef as any)[a.key] as number;
                const color = d > h ? "#DC2626" : d === h ? "#059669" : "#D9BC4B";
                return (
                  <td key={a.key} className="text-center px-2 py-2.5 text-xs font-black" style={{ color }}>
                    {d}/{h}
                  </td>
                );
              })}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Ana Component ─── */
export default function BolgeHedeflerClient({
  bolge, bolgeHedefler,
}: {
  bolge: { id: string; no: number; ad: string; iller: { id: string; ad: string }[] };
  bolgeHedefler: BolgeHedef[];
}) {
  const [hedefler, setHedefler] = useState(bolgeHedefler);

  async function refresh() {
    window.location.reload();
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="sv-page-header">
        <h1>Muradımız Dağıtımı</h1>
        <p>{bolge.ad} · İllere dönemlik hedef dağıtın</p>
      </div>

      {hedefler.length === 0 ? (
        <div className="sv-section p-12 text-center">
          <p className="font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
            Henüz bölgenize hedef atanmamış
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Genel Merkez tarafından bölgenize hedef atandığında burada görünecek ve illere dağıtabileceksiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {hedefler.map(h => (
            <BolgeHedefKart
              key={h.id}
              hedef={h}
              iller={bolge.iller}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
