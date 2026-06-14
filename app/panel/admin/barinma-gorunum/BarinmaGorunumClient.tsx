"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { MapPin, ChevronRight, ChevronDown, Home, Building2, Hotel, Users, ClipboardList } from "lucide-react";

interface Il { id: string; ad: string }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }
interface Ogrenci { id: string; adSoyad: string; bolum: string | null; sinif: string | null; bursMu: boolean; disiplinSayisi: number; iliskiKesme: boolean; notlar: string | null }
interface Ziyaret { id: string; tarih: string; ziyaretEden: string; notlar: string | null }
interface Unit { id: string; tip: string; ad: string; konum: string | null; ogrenciler: Ogrenci[]; ziyaretler: Ziyaret[] }

const TIP_LABEL: Record<string, string> = { EV: "Ev", APART: "Apart", YURT: "Yurt" };
const TIP_ICON: Record<string, React.ElementType> = { EV: Home, APART: Building2, YURT: Hotel };
const TIP_RENK: Record<string, string> = { EV: "#0B6B3A", APART: "#1D4ED8", YURT: "#B45309" };
const RENK = "#0B6B3A";

export function BarinmaGorunumClient({ sabitIller }: { sabitIller?: Il[] } = {}) {
  const [bolgeler, setBolgeler] = useState<Bolge[]>([]);
  const [acik, setAcik] = useState<Set<string>>(new Set());
  const [seciliIl, setSeciliIl] = useState<Il | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [acikUnit, setAcikUnit] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (sabitIller) return; fetch("/api/bolgeler").then(r => r.json()).then(setBolgeler).catch(() => {}); }, [sabitIller]);

  const yukle = useCallback(async () => {
    if (!seciliIl) { setUnits([]); return; }
    setLoading(true);
    try {
      const data = await fetch(`/api/housing-units?ilId=${seciliIl.id}`).then(r => (r.ok ? r.json() : []));
      setUnits(Array.isArray(data) ? data : []);
    } catch { setUnits([]); }
    setAcikUnit(new Set());
    setLoading(false);
  }, [seciliIl]);

  useEffect(() => { yukle(); }, [yukle]);

  const toggleBolge = (id: string) => setAcik(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleUnit = (id: string) => setAcikUnit(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const ozet = useMemo(() => ({
    birim: units.length,
    ogrenci: units.reduce((s, u) => s + u.ogrenciler.length, 0),
    ziyaret: units.reduce((s, u) => s + u.ziyaretler.length, 0),
  }), [units]);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: RENK }}>BARINMA YÖNETİMİ</p>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Barınma Görünümü <span className="font-semibold text-base" style={{ color: "var(--text-muted)" }}>(salt görüntüleme)</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Bölge / il ağacı */}
        <div className="sv-section overflow-hidden self-start">
          <div className="sv-section-header"><h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{sabitIller ? "İller" : "Bölgeler"}</h2></div>
          <div className="max-h-[70vh] overflow-y-auto p-2">
            {sabitIller ? (
              sabitIller.map(il => (
                <button key={il.id} onClick={() => setSeciliIl(il)}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] hover:bg-th flex items-center gap-2"
                  style={seciliIl?.id === il.id ? { background: RENK + "1a", color: RENK, fontWeight: 700 } : { color: "var(--text-secondary)" }}>
                  <MapPin size={13} style={{ color: RENK }} /> {il.ad}
                </button>
              ))
            ) : (<>
            {bolgeler.map(b => (
              <div key={b.id}>
                <button onClick={() => toggleBolge(b.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-semibold hover:bg-th text-left"
                  style={{ color: "var(--text-primary)" }}>
                  {acik.has(b.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <MapPin size={13} style={{ color: RENK }} /> {b.ad}
                  <span className="ml-auto text-[10px]" style={{ color: "var(--text-muted)" }}>{b.iller.length}</span>
                </button>
                {acik.has(b.id) && (
                  <div className="ml-5 border-l pl-2 mt-0.5 space-y-0.5" style={{ borderColor: "var(--border)" }}>
                    {b.iller.map(il => (
                      <button key={il.id} onClick={() => setSeciliIl(il)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] hover:bg-th"
                        style={seciliIl?.id === il.id ? { background: RENK + "1a", color: RENK, fontWeight: 700 } : { color: "var(--text-secondary)" }}>
                        {il.ad}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!bolgeler.length && <p className="px-3 py-4 text-xs" style={{ color: "var(--text-muted)" }}>Yükleniyor…</p>}
            </>)}
          </div>
        </div>

        {/* Birim listesi */}
        <div className="space-y-4">
          {seciliIl && (
            <div className="flex flex-wrap gap-3">
              {[{ l: "Birim", v: ozet.birim, i: Home }, { l: "Öğrenci", v: ozet.ogrenci, i: Users }, { l: "Ziyaret", v: ozet.ziyaret, i: ClipboardList }].map(k => {
                const I = k.i;
                return (
                  <div key={k.l} className="sv-section flex items-center gap-3 px-4 py-3 flex-1 min-w-[140px]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: RENK + "15", color: RENK }}><I size={18} /></div>
                    <div><p className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{k.v}</p><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{k.l}</p></div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="sv-section overflow-hidden">
            <div className="sv-section-header">
              <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{seciliIl ? `${seciliIl.ad} — Barınma Birimleri` : "Bir il seçin"}</h2>
            </div>
            {!seciliIl ? (
              <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Soldan bir bölge açıp il seçin; o ilin ev/apart/yurt birimleri, öğrencileri ve ziyaretleri burada listelenir.</div>
            ) : loading ? (
              <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Yükleniyor…</div>
            ) : !units.length ? (
              <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Bu il için barınma birimi kaydı yok.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {units.map(u => {
                  const I = TIP_ICON[u.tip] ?? Home;
                  const r = TIP_RENK[u.tip] ?? RENK;
                  const open = acikUnit.has(u.id);
                  return (
                    <div key={u.id}>
                      <button onClick={() => toggleUnit(u.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-th text-left">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: r + "15", color: r }}><I size={17} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{u.ad}</p>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            <span className="font-semibold" style={{ color: r }}>{TIP_LABEL[u.tip] ?? u.tip}</span>
                            {u.konum ? ` · ${u.konum}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-3 text-[11px] font-bold flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                          <span className="flex items-center gap-1"><Users size={12} /> {u.ogrenciler.length}</span>
                          <span className="flex items-center gap-1"><ClipboardList size={12} /> {u.ziyaretler.length}</span>
                          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      </button>
                      {open && (
                        <div className="px-4 pb-4 space-y-4" style={{ background: "var(--bg-th)" }}>
                          {/* Öğrenciler */}
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wide pt-3 pb-1.5" style={{ color: "var(--text-muted)" }}>Öğrenciler ({u.ogrenciler.length})</p>
                            {u.ogrenciler.length ? (
                              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
                                <table className="w-full text-xs">
                                  <thead className="bg-card border-b" style={{ borderColor: "var(--border)" }}>
                                    <tr>{["Ad Soyad", "Bölüm", "Sınıf", "Burs", "Disiplin", "İlişki Kesme"].map(h => (
                                      <th key={h} className="text-left px-2.5 py-1.5 font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {u.ogrenciler.map(o => (
                                      <tr key={o.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                                        <td className="px-2.5 py-1.5 font-semibold" style={{ color: "var(--text-primary)" }}>{o.adSoyad}</td>
                                        <td className="px-2.5 py-1.5" style={{ color: "var(--text-secondary)" }}>{o.bolum ?? "—"}</td>
                                        <td className="px-2.5 py-1.5" style={{ color: "var(--text-secondary)" }}>{o.sinif ?? "—"}</td>
                                        <td className="px-2.5 py-1.5">{o.bursMu ? <span className="text-green-600 font-bold">Burslu</span> : "—"}</td>
                                        <td className="px-2.5 py-1.5" style={{ color: "var(--text-secondary)" }}>{o.disiplinSayisi}</td>
                                        <td className="px-2.5 py-1.5">{o.iliskiKesme ? <span className="text-red-600 font-bold">Evet</span> : "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : <p className="text-xs" style={{ color: "var(--text-muted)" }}>Öğrenci kaydı yok.</p>}
                          </div>
                          {/* Ziyaretler */}
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wide pb-1.5" style={{ color: "var(--text-muted)" }}>Ziyaretler ({u.ziyaretler.length})</p>
                            {u.ziyaretler.length ? (
                              <div className="space-y-1.5">
                                {u.ziyaretler.map(z => (
                                  <div key={z.id} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-card border" style={{ borderColor: "var(--border)" }}>
                                    <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: RENK }}>{new Date(z.tarih).toLocaleDateString("tr-TR")}</span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{z.ziyaretEden}</p>
                                      {z.notlar && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{z.notlar}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ziyaret kaydı yok.</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
