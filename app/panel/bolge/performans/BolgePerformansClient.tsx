"use client";

import { useState, useMemo } from "react";

/* ─── Tipler ─── */
interface Activity {
  yil: number; donem: string;
  ls_yeniIntisap: number | null; uni_yeniIntisap: number | null;
  ls_toplamFaaliyet: number | null; uni_toplamFaaliyet: number | null;
  ls_kafileSayisi: number | null; uni_kafileSayisi: number | null;
  ls_sabahNamaziSayisi: number | null; uni_sabahNamaziSayisi: number | null;
  ls_ilimDersKatilim: number | null; uni_ilimDersKatilim: number | null;
  uni_kykBulusmaSayisi: number | null;
  eay_toplamZiyaret: number | null;
}
interface Il {
  id: string; ad: string;
  activities: Activity[];
  hedefler: { yil: number; donem: string; [key: string]: any }[];
}
interface IlHedef {
  id: string; ilId: string; yil: number; donem: string;
  [key: string]: any;
  il: { id: string; ad: string };
}
interface BolgeHedef {
  id: string; yil: number; donem: string;
  [key: string]: any;
  ilHedef: IlHedef[];
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

/* Faaliyet → hedef alanı eşleştirmesi */
function gerceklesenFromActivity(activities: Activity[], yil: number, donem: string): Record<HedefKey, number> {
  const f = activities.find(a => a.yil === yil && a.donem === donem);
  if (!f) return { yeniIntisap: 0, sosyalFaaliyet: 0, kafile: 0, sabahNamazi: 0, ilimDersi: 0, kykBulusma: 0, ziyaret: 0 };
  return {
    yeniIntisap:    (f.ls_yeniIntisap ?? 0) + (f.uni_yeniIntisap ?? 0),
    sosyalFaaliyet: (f.ls_toplamFaaliyet ?? 0) + (f.uni_toplamFaaliyet ?? 0),
    kafile:         (f.ls_kafileSayisi ?? 0) + (f.uni_kafileSayisi ?? 0),
    sabahNamazi:    (f.ls_sabahNamaziSayisi ?? 0) + (f.uni_sabahNamaziSayisi ?? 0),
    ilimDersi:      (f.ls_ilimDersKatilim ?? 0) + (f.uni_ilimDersKatilim ?? 0),
    kykBulusma:     f.uni_kykBulusmaSayisi ?? 0,
    ziyaret:        f.eay_toplamZiyaret ?? 0,
  };
}

function pct(g: number, h: number) {
  if (!h) return null;
  return Math.round((g / h) * 100);
}

function pctColor(v: number | null) {
  if (v === null) return "var(--text-muted)";
  if (v >= 90) return "#059669";
  if (v >= 70) return "#D9BC4B";
  return "#DC2626";
}

function PctBar({ value, color }: { value: number | null; color: string }) {
  const safe = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
        <div className="h-1.5 rounded-full" style={{ width: `${safe}%`, background: color }} />
      </div>
      {value !== null
        ? <span className="text-xs font-bold w-8 text-right" style={{ color }}>%{value}</span>
        : <span className="text-xs w-8 text-right" style={{ color: "var(--text-muted)" }}>—</span>
      }
    </div>
  );
}

/* ─── Genel Başarı Skoru ─── */
function BasariSkoru({ hedef, gerceklesen }: {
  hedef: Record<HedefKey, number>;
  gerceklesen: Record<HedefKey, number>;
}) {
  const oranlar = HEDEF_ALANLARI
    .map(a => pct(gerceklesen[a.key], hedef[a.key]))
    .filter((v): v is number => v !== null);

  if (oranlar.length === 0) return null;
  const ort = Math.round(oranlar.reduce((s, v) => s + v, 0) / oranlar.length);
  const color = pctColor(ort);

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl"
      style={{ background: `${color}10`, border: `2px solid ${color}40` }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
        Genel Başarı Skoru
      </p>
      <p className="text-5xl font-black" style={{ color }}>%{ort}</p>
      <p className="text-xs mt-2 font-semibold" style={{ color }}>
        {ort >= 90 ? "✓ Başarılı" : ort >= 70 ? "⚠ Dikkat" : "✗ Geliştirilmeli"}
      </p>
    </div>
  );
}

/* ─── Ana Component ─── */
export default function BolgePerformansClient({
  bolge, bolgeHedefler,
}: {
  bolge: { id: string; ad: string; no: number; iller: Il[] };
  bolgeHedefler: BolgeHedef[];
}) {
  const yilDonemler = useMemo(() =>
    bolgeHedefler.map(h => ({ id: h.id, label: `${h.yil} / ${DONEM_LABEL[h.donem]}`, yil: h.yil, donem: h.donem }))
  , [bolgeHedefler]);

  const [selectedIdx, setSelectedIdx] = useState(0);

  const secilenHedef = bolgeHedefler[selectedIdx];

  const bolgeGerceklesen = useMemo((): Record<HedefKey, number> | null => {
    if (!secilenHedef) return null;
    const result: Record<HedefKey, number> = {
      yeniIntisap: 0, sosyalFaaliyet: 0, kafile: 0,
      sabahNamazi: 0, ilimDersi: 0, kykBulusma: 0, ziyaret: 0,
    };
    for (const il of bolge.iller) {
      const g = gerceklesenFromActivity(il.activities, secilenHedef.yil, secilenHedef.donem);
      for (const a of HEDEF_ALANLARI) result[a.key] += g[a.key];
    }
    return result;
  }, [secilenHedef, bolge.iller]);

  const bolgeHedefVals = useMemo((): Record<HedefKey, number> | null => {
    if (!secilenHedef) return null;
    return HEDEF_ALANLARI.reduce((acc, a) => {
      acc[a.key] = secilenHedef[a.key] as number;
      return acc;
    }, {} as Record<HedefKey, number>);
  }, [secilenHedef]);

  if (bolgeHedefler.length === 0) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="sv-page-header">
          <h1>Performans Paneli</h1>
          <p>{bolge.ad}</p>
        </div>
        <div className="sv-section p-12 text-center">
          <p className="font-semibold" style={{ color: "var(--text-muted)" }}>
            Henüz bölgenize hedef atanmamış. Performans değerlendirmesi için Genel Merkez'in hedef girmesi gerekiyor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="sv-page-header">
        <h1>Performans Paneli</h1>
        <p>{bolge.ad} · Hedef vs Gerçekleşen</p>
      </div>

      {/* Dönem seçici */}
      <div className="flex gap-2 flex-wrap">
        {yilDonemler.map((yd, i) => (
          <button key={yd.id} onClick={() => setSelectedIdx(i)}
            className="px-4 py-2 rounded-xl text-sm font-bold border transition"
            style={i === selectedIdx
              ? { background: "var(--green-primary)", color: "#fff", borderColor: "transparent" }
              : { background: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border)" }
            }>
            {yd.label}
          </button>
        ))}
      </div>

      {secilenHedef && bolgeGerceklesen && bolgeHedefVals && (
        <>
          {/* Skor + Bölge özeti */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <BasariSkoru hedef={bolgeHedefVals} gerceklesen={bolgeGerceklesen} />
            <div className="md:col-span-3 sv-section p-5">
              <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
                Bölge Toplamı — {secilenHedef.yil} / {DONEM_LABEL[secilenHedef.donem]}
              </h3>
              <div className="space-y-3">
                {HEDEF_ALANLARI.map(a => {
                  const g = bolgeGerceklesen[a.key];
                  const h = bolgeHedefVals[a.key];
                  const p = pct(g, h);
                  const color = pctColor(p);
                  return (
                    <div key={a.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{a.label}</span>
                        <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                          {g} / {h}
                          {p !== null && <span className="ml-2" style={{ color }}>%{p}</span>}
                        </span>
                      </div>
                      <PctBar value={p} color={color} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* İl bazlı detay */}
          <div className="sv-section overflow-hidden">
            <div className="px-5 py-3 border-b" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>İl Bazlı Performans</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
                    <th className="text-left px-4 py-2.5 font-bold min-w-[120px]" style={{ color: "var(--text-muted)" }}>İl</th>
                    {HEDEF_ALANLARI.map(a => (
                      <th key={a.key} className="text-center px-2 py-2.5 font-bold min-w-[90px]"
                        style={{ color: "var(--text-muted)" }}>{a.label}</th>
                    ))}
                    <th className="text-center px-3 py-2.5 font-bold min-w-[80px]" style={{ color: "var(--text-muted)" }}>
                      Skor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {bolge.iller
                    .map(il => {
                      const ilHedef = secilenHedef.ilHedef.find((ih: IlHedef) => ih.ilId === il.id);
                      const g = gerceklesenFromActivity(il.activities, secilenHedef.yil, secilenHedef.donem);
                      // pct() hedefi 0/boş olan kategoriler için null döner — yalnızca hedefi olan kategoriler ortalamaya girer
                      const skorlar = HEDEF_ALANLARI
                        .map(a => ilHedef ? pct(g[a.key], ilHedef[a.key] as number) : null)
                        .filter((v): v is number => v !== null);
                      const genel = skorlar.length
                        ? Math.round(skorlar.reduce((s, v) => s + v, 0) / skorlar.length)
                        : null;
                      return { il, ilHedef, g, genel };
                    })
                    .sort((a, b) => (b.genel ?? -1) - (a.genel ?? -1))
                    .map(({ il, ilHedef, g, genel }) => (
                      <tr key={il.id} className="hover:bg-[color:var(--bg-hover)] transition">
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{il.ad}</td>
                        {HEDEF_ALANLARI.map(a => {
                          const gv = g[a.key];
                          const hv = ilHedef ? (ilHedef as any)[a.key] as number : null;
                          const p = hv !== null ? pct(gv, hv) : null;
                          const color = pctColor(p);
                          return (
                            <td key={a.key} className="px-2 py-3 text-center">
                              {hv !== null ? (
                                <div>
                                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{gv} / {hv}</p>
                                  <p className="text-[10px] font-bold" style={{ color }}>%{p}</p>
                                </div>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center">
                          {genel !== null ? (
                            <span className="text-sm font-black px-2 py-1 rounded-lg"
                              style={{ background: `${pctColor(genel)}18`, color: pctColor(genel) }}>
                              %{genel}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
