export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { bolgeGenclikFaaliyetler, ilFaaliyetOzetleri } from "@/lib/genclik-veri";
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";

// Bölge Üniversite / Lise Gençlik Sorumlusu — Eksik Veri Girişi – İller
// (her ilin girdiği toplam faaliyet sayısı + son faaliyet giriş tarihi)
export default async function BolgeGenclikIllerPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");

  const sistem = session.user.sistem;
  if (sistem !== "UNIVERSITE" && sistem !== "LISE") redirect("/panel/bolge/iller");

  const bolgeId = session.user.activeBolgeId;
  if (!bolgeId) redirect("/panel/beklemede");

  const bolgeAd = (await prisma.bolge.findUnique({ where: { id: bolgeId }, select: { ad: true } }))?.ad ?? "Bölge";
  const { iller, faaliyetler } = await bolgeGenclikFaaliyetler(bolgeId, sistem);
  const ozetler = ilFaaliyetOzetleri(iller, faaliyetler).sort((a, b) => b.toplam - a.toplam);

  const giren = ozetler.filter(o => o.toplam > 0).length;
  const renk = sistem === "UNIVERSITE" ? "#1D4ED8" : "#7C3AED";
  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <MapPin size={22} style={{ color: renk }} /> Eksik Veri Girişi – İller
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {bolgeAd} · {sistem === "UNIVERSITE" ? "Üniversite" : "Lise"} Gençlik — illerin faaliyet giriş durumu
        </p>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Toplam İl</p>
          <p className="text-3xl font-black mt-1" style={{ color: "var(--text-primary)" }}>{ozetler.length}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Veri Giren İl</p>
          <p className="text-3xl font-black mt-1" style={{ color: "#047857" }}>{giren}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Veri Bekleyen</p>
          <p className="text-3xl font-black mt-1" style={{ color: "#DC2626" }}>{ozetler.length - giren}</p>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: "var(--bg-th)" }}>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {["İl", "Durum", "Toplam Faaliyet", "Toplam Katılımcı", "Son Giriş Tarihi"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ozetler.map(o => (
                <tr key={o.ilId} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>{o.il}</td>
                  <td className="px-4 py-3">
                    {o.toplam > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold"
                        style={{ background: "rgba(5,150,105,0.12)", color: "#047857" }}>
                        <CheckCircle2 size={13} /> Girildi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold"
                        style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>
                        <AlertCircle size={13} /> Veri Yok
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-black" style={{ color: o.toplam > 0 ? renk : "var(--text-muted)" }}>{o.toplam}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{o.katilimci.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{fmt(o.sonGiris)}</td>
                </tr>
              ))}
              {ozetler.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: "var(--text-muted)" }}>Bölgenize henüz il atanmamış.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
