export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

export default async function BolgePanelPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");

  const bolgeId = session.user.activeBolgeId;
  if (!bolgeId) redirect("/panel/beklemede");

  const THIS_YEAR = new Date().getFullYear();

  const bolge = await prisma.bolge.findUnique({
    where: { id: bolgeId },
    include: {
      iller: {
        include: {
          activities: { orderBy: [{ yil: "desc" }, { donem: "asc" }], take: 1 },
          assignments: { where: { status: "AKTIF" }, include: { user: true }, take: 1 },
        },
        orderBy: { ad: "asc" },
      },
    },
  });

  const iller = bolge?.iller ?? [];
  const veriGirilmis  = iller.filter(i => i.activities.length > 0);
  const veriYok       = iller.filter(i => i.activities.length === 0);
  const sorumlulu     = iller.filter(i => i.assignments.length > 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{bolge?.ad}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Bölge Sorumlusu Paneli</p>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Toplam İl", val: iller.length, color: "border-blue-200 bg-blue-50 text-blue-800" },
          { label: "Veri Girildi", val: veriGirilmis.length, color: "border-green-200 bg-green-50 text-green-800" },
          { label: "Veri Girilmedi", val: veriYok.length, color: "border-red-200 bg-red-50 text-red-800" },
          { label: "Sorumlu Atanmış", val: sorumlulu.length, color: "border-purple-200 bg-purple-50 text-purple-800" },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 text-center ${c.color}`}>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">{c.label}</p>
            <p className="text-3xl font-black mt-1">{c.val}</p>
          </div>
        ))}
      </div>

      {/* İl listesi */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>İl Durumları</h2>
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{THIS_YEAR} yılı verisi</span>
        </div>
        <table className="w-full text-sm">
          <thead style={{ background: "var(--bg-th)" }}>
            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
              {["İl", "Sorumlu", "Son Veri", "Durum"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {iller.map((il) => {
              const sorumlu = il.assignments[0]?.user;
              const sonF = il.activities[0];
              const suYil = sonF?.yil === THIS_YEAR;
              const status = !sonF ? "none" : suYil ? "ok" : "old";

              return (
                <tr key={il.id} className="border-t hover:bg-[color:var(--bg-hover)] transition" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-3 font-bold" style={{ color: "var(--text-primary)" }}>{il.ad}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {sorumlu ? `${sorumlu.ad} ${sorumlu.soyad}` : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {sonF ? `${sonF.yil} / ${DONEM_LABEL[sonF.donem]}` : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {status === "ok" && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-700">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Veri Girildi
                      </span>
                    )}
                    {status === "old" && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-700">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>Eksik / Eski Veri
                      </span>
                    )}
                    {status === "none" && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>Veri Girilmedi
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
