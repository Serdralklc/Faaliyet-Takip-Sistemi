export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/* ── Yardımcılar ── */
function pct(pay: number, payda: number) {
  if (!payda) return 0;
  return Math.round((pay / payda) * 100);
}

function n(v: number | null | undefined) { return v ?? 0; }

/* ── Bileşenler ── */
function MetrikKart({ label, value, sub, color, suffix = "" }: {
  label: string; value: string | number; sub?: string; color: string; suffix?: string;
}) {
  return (
    <div className="rounded-2xl border p-4 relative overflow-hidden"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />
      <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-black leading-none" style={{ color }}>
        {value}{suffix}
      </p>
      {sub && <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

function DonemBaslik({ yil, donem, color }: { yil: number; donem: string; color: string }) {
  const DONEM_LABEL: Record<string, string> = {
    DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
  };
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b"
      style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
        {yil} / {DONEM_LABEL[donem]}
      </h3>
    </div>
  );
}

/* ── Ana Sayfa ── */
export default async function IlRaporlarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "IL_SORUMLUSU") redirect("/");
  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");

  const il = await prisma.il.findUnique({ where: { id: ilId }, include: { bolge: true } });
  const faaliyetler = await prisma.activity.findMany({
    where: { ilId },
    orderBy: [{ yil: "desc" }, { donem: "asc" }],
  });

  if (faaliyetler.length === 0) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="sv-page-header">
          <h1>Raporlar</h1>
          <p>{il?.ad} · {il?.bolge.ad}</p>
        </div>
        <div className="sv-section p-16 text-center">
          <p className="font-semibold" style={{ color: "var(--text-muted)" }}>Henüz faaliyet kaydı yok</p>
        </div>
      </div>
    );
  }

  // Dönemlere göre grupla
  const donemMap = new Map(faaliyetler.map(f => [`${f.yil}-${f.donem}`, f]));
  const yillar = [...new Set(faaliyetler.map(f => f.yil))].sort((a, b) => b - a);

  const IK_DONEMLER  = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];
  const LS_DONEMLER  = ["DONEM_1", "DONEM_2"];
  const UNI_DONEMLER = ["DONEM_1", "DONEM_2"];

  return (
    <div className="p-6 max-w-5xl space-y-10">
      <div className="sv-page-header">
        <h1>Raporlar</h1>
        <p>{il?.ad} · {il?.bolge.ad} · {faaliyetler.length} dönem kaydı</p>
      </div>

      {yillar.map(yil => (
        <div key={yil} className="space-y-6">
          {/* Yıl başlığı */}
          <div className="flex items-center gap-3">
            <div className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{yil} Yılı</div>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* ── İLKÖĞRETİM ── */}
          <div className="sv-section overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-2 border-b"
              style={{ background: "#006B3F", borderColor: "#005532" }}>
              <span className="text-white font-bold text-sm">📚 İlköğretim Birimi</span>
            </div>

            {IK_DONEMLER.map(donem => {
              const f = donemMap.get(`${yil}-${donem}`);
              if (!f) return (
                <div key={donem} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <DonemBaslik yil={yil} donem={donem} color="#006B3F" />
                  <p className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>Bu dönem veri girilmemiş.</p>
                </div>
              );

              const toplamDergah    = n(f.ik_toplamDergah);
              const kursDergah      = n(f.ik_kursuYapilanDergah);
              const elifBaOgrenci   = n(f.ik_elifBaOgrenci);
              const kuranOgrenci    = n(f.ik_kuranOgrenci);
              const gecisOgrenci    = n(f.ik_gecisOgrenci);
              const toplamOgrenci   = elifBaOgrenci + kuranOgrenci;
              const kursBaşari      = pct(kursDergah, toplamDergah);

              return (
                <div key={donem} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <DonemBaslik yil={yil} donem={donem} color="#006B3F" />
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <MetrikKart
                      label="Toplam Dergah"
                      value={toplamDergah}
                      color="#006B3F"
                    />
                    <MetrikKart
                      label="Kurs Başarısı"
                      value={kursBaşari}
                      suffix="%"
                      sub={`${kursDergah} / ${toplamDergah} dergah`}
                      color={kursBaşari >= 70 ? "#059669" : kursBaşari >= 40 ? "#D9BC4B" : "#DC2626"}
                    />
                    <MetrikKart
                      label="Toplam Öğrenci"
                      value={toplamOgrenci}
                      sub={`Elif-Ba: ${elifBaOgrenci} · Kuran: ${kuranOgrenci}`}
                      color="#0369A1"
                    />
                    <MetrikKart
                      label="Elif-Ba → Kuran Geçiş"
                      value={gecisOgrenci}
                      sub={elifBaOgrenci ? `${pct(gecisOgrenci, elifBaOgrenci)}% geçiş oranı` : undefined}
                      color="#7C3AED"
                    />
                    <MetrikKart
                      label="Eğitmen"
                      value={n(f.ik_egitmenSayisi)}
                      sub={`Yrd: ${n(f.ik_egitmenYardimciSayisi)}`}
                      color="#EA580C"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── LİSE ── */}
          <div className="sv-section overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-2 border-b"
              style={{ background: "#0369A1", borderColor: "#025484" }}>
              <span className="text-white font-bold text-sm">🎓 Lise Birimi</span>
            </div>

            {LS_DONEMLER.map(donem => {
              const f = donemMap.get(`${yil}-${donem}`);
              if (!f) return (
                <div key={donem} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <DonemBaslik yil={yil} donem={donem} color="#0369A1" />
                  <p className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>Bu dönem veri girilmemiş.</p>
                </div>
              );

              const toplamDergah  = n(f.ls_toplamDergah);
              const ilimDersYeri  = n(f.ls_ilimDersYeri);
              const ilimBasari    = pct(ilimDersYeri, toplamDergah);

              return (
                <div key={donem} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <DonemBaslik yil={yil} donem={donem} color="#0369A1" />
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MetrikKart
                      label="Toplam Dergah"
                      value={toplamDergah}
                      color="#0369A1"
                    />
                    <MetrikKart
                      label="İlim Dersi Başarısı"
                      value={ilimBasari}
                      suffix="%"
                      sub={`${ilimDersYeri} / ${toplamDergah} dergah`}
                      color={ilimBasari >= 70 ? "#059669" : ilimBasari >= 40 ? "#D9BC4B" : "#DC2626"}
                    />
                    <MetrikKart
                      label="İlim Dersi Katılım"
                      value={n(f.ls_ilimDersKatilim)}
                      sub="öğrenci"
                      color="#0891B2"
                    />
                    <MetrikKart
                      label="Sabah Namazı"
                      value={n(f.ls_sabahNamaziSayisi)}
                      sub={`${n(f.ls_sabahNamaziKatilim)} katılım`}
                      color="#6366F1"
                    />
                    <MetrikKart
                      label="Kafile Sayısı"
                      value={n(f.ls_kafileSayisi)}
                      sub={`${n(f.ls_kafileOgrenci)} öğrenci`}
                      color="#8B5CF6"
                    />
                    <MetrikKart
                      label="Sosyal Faaliyet"
                      value={n(f.ls_toplamFaaliyet)}
                      color="#059669"
                    />
                  </div>

                  {/* İntisap vurgu */}
                  {n(f.ls_yeniIntisap) > 0 && (
                    <div className="mx-5 mb-5 flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "var(--green-light)" }}>
                      <span className="text-xl">🌱</span>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--green-primary)" }}>
                          Bu dönem <span className="text-xl">{n(f.ls_yeniIntisap)}</span> yeni intisap
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── ÜNİVERSİTE ── */}
          <div className="sv-section overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-2 border-b"
              style={{ background: "#7C3AED", borderColor: "#6027C8" }}>
              <span className="text-white font-bold text-sm">🎯 Üniversite Birimi</span>
            </div>

            {UNI_DONEMLER.map(donem => {
              const f = donemMap.get(`${yil}-${donem}`);
              if (!f) return (
                <div key={donem} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <DonemBaslik yil={yil} donem={donem} color="#7C3AED" />
                  <p className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>Bu dönem veri girilmemiş.</p>
                </div>
              );

              const toplamDergah  = n(f.uni_toplamDergah);
              const ilimDersYeri  = n(f.uni_ilimDersYeri);
              const ilimBasari    = pct(ilimDersYeri, toplamDergah);

              return (
                <div key={donem} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <DonemBaslik yil={yil} donem={donem} color="#7C3AED" />
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MetrikKart
                      label="Toplam Dergah"
                      value={toplamDergah}
                      color="#7C3AED"
                    />
                    <MetrikKart
                      label="İlim Dersi Başarısı"
                      value={ilimBasari}
                      suffix="%"
                      sub={`${ilimDersYeri} / ${toplamDergah} dergah`}
                      color={ilimBasari >= 70 ? "#059669" : ilimBasari >= 40 ? "#D9BC4B" : "#DC2626"}
                    />
                    <MetrikKart
                      label="İlim Dersi Katılım"
                      value={n(f.uni_ilimDersKatilim)}
                      sub="öğrenci"
                      color="#6366F1"
                    />
                    <MetrikKart
                      label="Sabah Namazı"
                      value={n(f.uni_sabahNamaziSayisi)}
                      sub={`${n(f.uni_sabahNamaziKatilim)} katılım`}
                      color="#8B5CF6"
                    />
                    <MetrikKart
                      label="Kafile Sayısı"
                      value={n(f.uni_kafileSayisi)}
                      sub={`${n(f.uni_kafileOgrenci)} öğrenci`}
                      color="#A855F7"
                    />
                    <MetrikKart
                      label="Sosyal Faaliyet"
                      value={n(f.uni_toplamFaaliyet)}
                      color="#059669"
                    />
                  </div>

                  {/* KYK + İntisap vurgu */}
                  <div className="mx-5 mb-5 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                      style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
                      <span className="text-lg">🏛️</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>KYK Buluşması</p>
                        <p className="font-black" style={{ color: "#7C3AED" }}>
                          {n(f.uni_kykBulusmaSayisi)} buluşma · {n(f.uni_kykKatilim)} katılım
                        </p>
                      </div>
                    </div>
                    {n(f.uni_yeniIntisap) > 0 && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: "var(--green-light)" }}>
                        <span className="text-lg">🌱</span>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Yeni İntisap</p>
                          <p className="font-black" style={{ color: "var(--green-primary)" }}>
                            {n(f.uni_yeniIntisap)} kişi
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ))}
    </div>
  );
}
