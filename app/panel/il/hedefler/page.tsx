export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const HEDEF_ALANLARI = [
  { key: "yeniIntisap",    label: "Yeni İntisap" },
  { key: "sosyalFaaliyet", label: "Sosyal Faaliyet" },
  { key: "kafile",         label: "Kafile" },
  { key: "sabahNamazi",    label: "Sabah Namazı" },
  { key: "ilimDersi",      label: "İlim Dersi Katılım" },
  { key: "kykBulusma",     label: "KYK Buluşması" },
  { key: "ziyaret",        label: "Ziyaret" },
] as const;

type HedefKey = typeof HEDEF_ALANLARI[number]["key"];

const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

function n(v: number | null | undefined) { return v ?? 0; }
function pct(g: number, h: number) { return h ? Math.round((g / h) * 100) : 0; }

function pctColor(v: number) {
  if (v >= 90) return "#059669";
  if (v >= 70) return "#D9BC4B";
  return "#DC2626";
}

function gerceklesen(f: any): Record<HedefKey, number> {
  return {
    yeniIntisap:    n(f.ls_yeniIntisap) + n(f.uni_yeniIntisap),
    sosyalFaaliyet: n(f.ls_toplamFaaliyet) + n(f.uni_toplamFaaliyet),
    kafile:         n(f.ls_kafileSayisi) + n(f.uni_kafileSayisi),
    sabahNamazi:    n(f.ls_sabahNamaziSayisi) + n(f.uni_sabahNamaziSayisi),
    ilimDersi:      n(f.ls_ilimDersKatilim) + n(f.uni_ilimDersKatilim),
    kykBulusma:     n(f.uni_kykBulusmaSayisi),
    ziyaret:        n(f.eay_toplamZiyaret),
  };
}

export default async function IlHedeflerPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "IL_SORUMLUSU") redirect("/");
  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");

  const [il, hedefler, faaliyetler] = await Promise.all([
    prisma.il.findUnique({ where: { id: ilId }, include: { bolge: true } }),
    prisma.ilHedef.findMany({
      where: { ilId },
      orderBy: [{ yil: "desc" }, { donem: "asc" }],
    }),
    prisma.activity.findMany({ where: { ilId } }),
  ]);

  if (!il) redirect("/panel/beklemede");

  /* Faaliyet haritası */
  const fMap = new Map(faaliyetler.map(f => [`${f.yil}-${f.donem}`, f]));

  const hedefWithGerceklesen = hedefler.map(h => {
    const f = fMap.get(`${h.yil}-${h.donem}`);
    const g = f ? gerceklesen(f) : null;
    const skorlar = g
      ? HEDEF_ALANLARI.map(a => h[a.key] > 0 ? pct(g[a.key], h[a.key]) : null).filter((v): v is number => v !== null)
      : [];
    const genelSkor = skorlar.length ? Math.round(skorlar.reduce((s, v) => s + v, 0) / skorlar.length) : null;
    return { h, g, genelSkor };
  });

  if (hedefler.length === 0) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="sv-page-header">
          <h1>Muradımız Merkezi</h1>
          <p>{il.ad} · {il.bolge.ad}</p>
        </div>
        <div className="sv-section p-12 text-center">
          <p className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>Henüz hedef atanmamış</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Bölge sorumlusunuz size hedef atadığında burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="sv-page-header">
        <h1>Muradımız Merkezi</h1>
        <p>{il.ad} · {il.bolge.ad} · {hedefler.length} dönem hedefi</p>
      </div>

      {hedefWithGerceklesen.map(({ h, g, genelSkor }) => (
        <div key={h.id} className="sv-section overflow-hidden">
          {/* Başlık */}
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
            <div>
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
                {h.yil} / {DONEM_LABEL[h.donem]}
              </h3>
              {!g && (
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

          {/* Hedef kartları */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HEDEF_ALANLARI.map(a => {
              const hedefVal = h[a.key];
              const gerceklesVal = g ? g[a.key] : 0;
              const oran = pct(gerceklesVal, hedefVal);
              const color = hedefVal === 0 ? "var(--text-muted)" : pctColor(oran);
              const kalan = Math.max(0, hedefVal - gerceklesVal);
              const safe = Math.min(100, oran);

              return (
                <div key={a.key} className="rounded-2xl border p-4 relative overflow-hidden"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 pl-1"
                    style={{ color: "var(--text-muted)" }}>{a.label}</p>

                  {hedefVal === 0 ? (
                    <p className="text-sm pl-1" style={{ color: "var(--text-muted)" }}>Hedef belirtilmemiş</p>
                  ) : (
                    <>
                      <div className="flex items-end gap-1 pl-1 mb-2">
                        <span className="text-2xl font-black" style={{ color }}>
                          {g ? gerceklesVal : "—"}
                        </span>
                        <span className="text-base font-bold mb-0.5" style={{ color: "var(--text-muted)" }}>
                          / {hedefVal}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "var(--bg-hover)" }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${safe}%`, background: color }} />
                      </div>
                      <div className="flex justify-between items-center pl-1">
                        <span className="text-xs font-bold" style={{ color }}>%{oran} Tamamlandı</span>
                        {kalan > 0 && g && (
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Kalan: {kalan}</span>
                        )}
                        {oran >= 100 && (
                          <span className="text-[10px] font-bold" style={{ color: "#059669" }}>✓ Hedef aşıldı!</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
