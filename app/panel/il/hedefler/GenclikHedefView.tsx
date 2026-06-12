import type { HedefMetrik } from "@/lib/genclik-hedef";

const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

function pct(g: number, h: number) { return h ? Math.round((g / h) * 100) : 0; }
function pctColor(v: number) {
  if (v >= 90) return "#059669";
  if (v >= 70) return "#D9BC4B";
  return "#DC2626";
}

export interface DonemHedef {
  yil: number;
  donem: string;
  hedefler: Record<string, number>;
  gerceklesen: Record<string, number>;
  faaliyetVar: boolean;
}

export function GenclikHedefView({ baslik, altBaslik, metrikler, donemler }: {
  baslik: string;
  altBaslik: string;
  metrikler: HedefMetrik[];
  donemler: DonemHedef[];
}) {
  const dolu = donemler.filter(d => Object.keys(d.hedefler).length > 0);

  if (dolu.length === 0) {
    return (
      <div className="p-6 max-w-5xl">
        <div className="sv-page-header">
          <h1>{baslik}</h1>
          <p>{altBaslik}</p>
        </div>
        <div className="sv-section p-12 text-center">
          <p className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>Henüz murad atanmamış</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Bölge sorumlunuz veya yönetim murad belirlediğinde burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="sv-page-header">
        <h1>{baslik}</h1>
        <p>{altBaslik} · {dolu.length} dönem muradı</p>
      </div>

      {dolu.map(d => {
        const aktifMetrik = metrikler.filter(m => (d.hedefler[m.key] ?? 0) > 0);
        const skorlar = aktifMetrik.map(m => pct(d.gerceklesen[m.key] ?? 0, d.hedefler[m.key]));
        const genelSkor = skorlar.length ? Math.round(skorlar.reduce((s, v) => s + v, 0) / skorlar.length) : null;

        return (
          <div key={`${d.yil}-${d.donem}`} className="sv-section overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b"
              style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
              <div>
                <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {d.yil} / {DONEM_LABEL[d.donem] ?? d.donem}
                </h3>
                {!d.faaliyetVar && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Bu dönem için henüz faaliyet girilmemiş
                  </p>
                )}
              </div>
              {genelSkor !== null && (
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Genel Skor</p>
                  <span className="text-2xl font-black px-3 py-1 rounded-xl"
                    style={{ background: `${pctColor(genelSkor)}15`, color: pctColor(genelSkor) }}>
                    %{genelSkor}
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {aktifMetrik.map(m => {
                const hedefVal = d.hedefler[m.key];
                const gerceklesVal = d.gerceklesen[m.key] ?? 0;
                const oran = pct(gerceklesVal, hedefVal);
                const color = pctColor(oran);
                const kalan = Math.max(0, hedefVal - gerceklesVal);
                const safe = Math.min(100, oran);
                return (
                  <div key={m.key} className="rounded-2xl border p-4 relative overflow-hidden"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 pl-1" style={{ color: "var(--text-muted)" }}>{m.label}</p>
                    <div className="flex items-end gap-1 pl-1 mb-2">
                      <span className="text-2xl font-black" style={{ color }}>{gerceklesVal}</span>
                      <span className="text-base font-bold mb-0.5" style={{ color: "var(--text-muted)" }}>/ {hedefVal}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "var(--bg-hover)" }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${safe}%`, background: color }} />
                    </div>
                    <div className="flex justify-between items-center pl-1">
                      <span className="text-xs font-bold" style={{ color }}>%{oran} Tamamlandı</span>
                      {oran >= 100
                        ? <span className="text-[10px] font-bold" style={{ color: "#059669" }}>✓ Murad aşıldı!</span>
                        : kalan > 0 && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Kalan: {kalan}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
