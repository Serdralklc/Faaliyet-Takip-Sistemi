"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { MapPin, ChevronRight, ChevronDown, GraduationCap, School } from "lucide-react";
import { UNI_KATEGORI_LABEL, UNI_KATEGORI_RENK } from "@/lib/universite-faaliyet";
import { KATEGORI_LABEL as LISE_KAT_LABEL, KATEGORI_RENK as LISE_KAT_RENK } from "@/lib/lise-faaliyet";

type Sistem = "UNIVERSITE" | "LISE";
interface Il { id: string; ad: string }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }
interface Faaliyet {
  id: string; tarih: string; yil: number; donem: string; kategori: string;
  faaliyetAdi: string; yer: string | null; katilimci: number; yeniIntisap: number;
}

const DONEM_LABEL: Record<string, string> = { DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi" };

const yilSecenekleri = (() => {
  const list: number[] = [];
  for (let y = 2025; y <= 2030; y++) list.push(y);
  return list;
})();

export function IlFaaliyetClient({ sistemler }: { sistemler: Sistem[] }) {
  const [sistem, setSistem] = useState<Sistem>(sistemler[0] ?? "UNIVERSITE");
  const [bolgeler, setBolgeler] = useState<Bolge[]>([]);
  const [acik, setAcik] = useState<Set<string>>(new Set());
  const [seciliIl, setSeciliIl] = useState<Il | null>(null);
  const [yil, setYil] = useState<number | "">("");
  const [donem, setDonem] = useState<string>("");
  const [faaliyetler, setFaaliyetler] = useState<Faaliyet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/bolgeler").then(r => r.json()).then(setBolgeler).catch(() => {});
  }, []);

  const katLabel = sistem === "UNIVERSITE" ? UNI_KATEGORI_LABEL : LISE_KAT_LABEL;
  const katRenk = sistem === "UNIVERSITE" ? UNI_KATEGORI_RENK : LISE_KAT_RENK;
  const renk = sistem === "UNIVERSITE" ? "#1D4ED8" : "#7C3AED";

  const yukle = useCallback(async () => {
    if (!seciliIl) { setFaaliyetler([]); return; }
    setLoading(true);
    const q = new URLSearchParams({ ilId: seciliIl.id });
    if (yil) q.set("yil", String(yil));
    if (donem) q.set("donem", donem);
    const ep = sistem === "UNIVERSITE" ? "universite-faaliyetler" : "lise-faaliyetler";
    try {
      const data = await fetch(`/api/${ep}?${q}`).then(r => (r.ok ? r.json() : []));
      setFaaliyetler(Array.isArray(data) ? data : []);
    } catch { setFaaliyetler([]); }
    setLoading(false);
  }, [seciliIl, yil, donem, sistem]);

  useEffect(() => { yukle(); }, [yukle]);

  const toggleBolge = (id: string) => setAcik(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const ozet = useMemo(() => {
    const toplamKatilimci = faaliyetler.reduce((s, f) => s + (f.katilimci || 0), 0);
    const toplamIntisap = faaliyetler.reduce((s, f) => s + (f.yeniIntisap || 0), 0);
    return { adet: faaliyetler.length, toplamKatilimci, toplamIntisap };
  }, [faaliyetler]);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: renk }}>İL FAALİYET TAKİP</p>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            İl Faaliyetleri <span className="font-semibold text-base" style={{ color: "var(--text-muted)" }}>(salt görüntüleme)</span>
          </h1>
        </div>
        <div className="flex items-end gap-2.5 flex-wrap">
          {sistemler.length > 1 && (
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setSistem("UNIVERSITE")} className="px-3 py-2 text-xs font-bold flex items-center gap-1.5"
                style={sistem === "UNIVERSITE" ? { background: "#1D4ED8", color: "#fff" } : { color: "var(--text-muted)" }}>
                <GraduationCap size={14} /> Üniversite
              </button>
              <button onClick={() => setSistem("LISE")} className="px-3 py-2 text-xs font-bold flex items-center gap-1.5"
                style={sistem === "LISE" ? { background: "#7C3AED", color: "#fff" } : { color: "var(--text-muted)" }}>
                <School size={14} /> Lise
              </button>
            </div>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Yıl</span>
            <select value={yil} onChange={e => setYil(e.target.value ? Number(e.target.value) : "")}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2">
              <option value="">Tümü</option>
              {yilSecenekleri.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dönem</span>
            <select value={donem} onChange={e => setDonem(e.target.value)}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2">
              <option value="">Tümü</option>
              <option value="DONEM_1">1. Dönem</option>
              <option value="DONEM_2">2. Dönem</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Bölge / il ağacı */}
        <div className="sv-section overflow-hidden self-start">
          <div className="sv-section-header"><h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Bölgeler</h2></div>
          <div className="max-h-[70vh] overflow-y-auto p-2">
            {bolgeler.map(b => (
              <div key={b.id}>
                <button onClick={() => toggleBolge(b.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-semibold hover:bg-th text-left"
                  style={{ color: "var(--text-primary)" }}>
                  {acik.has(b.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <MapPin size={13} style={{ color: renk }} /> {b.ad}
                  <span className="ml-auto text-[10px]" style={{ color: "var(--text-muted)" }}>{b.iller.length}</span>
                </button>
                {acik.has(b.id) && (
                  <div className="ml-5 border-l pl-2 mt-0.5 space-y-0.5" style={{ borderColor: "var(--border)" }}>
                    {b.iller.map(il => (
                      <button key={il.id} onClick={() => setSeciliIl(il)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] hover:bg-th"
                        style={seciliIl?.id === il.id ? { background: renk + "1a", color: renk, fontWeight: 700 } : { color: "var(--text-secondary)" }}>
                        {il.ad}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!bolgeler.length && <p className="px-3 py-4 text-xs" style={{ color: "var(--text-muted)" }}>Yükleniyor…</p>}
          </div>
        </div>

        {/* Faaliyet listesi */}
        <div className="sv-section overflow-hidden">
          <div className="sv-section-header flex items-center justify-between">
            <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              {seciliIl ? `${seciliIl.ad} — Faaliyetler` : "Bir il seçin"}
            </h2>
            {seciliIl && (
              <div className="flex gap-3 text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
                <span>{ozet.adet} faaliyet</span>
                <span>{ozet.toplamKatilimci} katılımcı</span>
                <span>{ozet.toplamIntisap} yeni intisap</span>
              </div>
            )}
          </div>
          {!seciliIl ? (
            <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Soldan bir bölge açıp il seçin; o ilin {sistem === "UNIVERSITE" ? "üniversite" : "lise"} gençlik faaliyetleri burada listelenir.
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Yükleniyor…</div>
          ) : !faaliyetler.length ? (
            <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Bu il için kayıt bulunamadı.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-th border-b" style={{ borderColor: "var(--border)" }}>
                  <tr>
                    {["Tarih", "Kategori", "Faaliyet", "Yer", "Katılımcı", "Yeni İntisap"].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {faaliyetler.map(f => (
                    <tr key={f.id} className="border-b hover:bg-th" style={{ borderColor: "var(--border)" }}>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(f.tarih).toLocaleDateString("tr-TR")}
                        <div className="text-[10px]">{DONEM_LABEL[f.donem] ?? f.donem} · {f.yil}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                          style={{ background: (katRenk[f.kategori] ?? renk) + "1a", color: katRenk[f.kategori] ?? renk }}>
                          {katLabel[f.kategori] ?? f.kategori}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: "var(--text-primary)" }}>{f.faaliyetAdi}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>{f.yer ?? "—"}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{f.katilimci}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{f.yeniIntisap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
