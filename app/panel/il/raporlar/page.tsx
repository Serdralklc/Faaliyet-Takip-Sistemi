export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

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
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Raporlar</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>{il?.ad} · {il?.bolge.ad}</p>
        <div className="rounded-xl border-2 border-dashed p-16 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="font-semibold" style={{ color: "var(--text-muted)" }}>Henüz faaliyet kaydı yok</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Raporlar</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{il?.ad} · {il?.bolge.ad} · {faaliyetler.length} dönem kaydı</p>
      </div>

      <div className="space-y-6">
        {faaliyetler.map((f) => (
          <div key={f.id} className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 flex items-center justify-between border-b" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>{f.yil} / {DONEM_LABEL[f.donem]}</h2>
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {f.createdByName} · {new Date(f.createdAt).toLocaleDateString("tr-TR")}
              </span>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "İK Dergah", val: f.ik_toplamDergah, color: "text-blue-600" },
                { label: "Lise Dergah", val: f.ls_toplamDergah, color: "text-green-600" },
                { label: "Üni Dergah", val: f.uni_toplamDergah, color: "text-purple-600" },
                { label: "Yeni İntisap", val: (f.ls_yeniIntisap ?? 0) + (f.uni_yeniIntisap ?? 0), color: "text-indigo-600" },
                { label: "Mevcut Ev", val: f.eay_mevcutEv, color: "text-orange-600" },
                { label: "Mevcut Apart", val: f.eay_mevcutApart, color: "text-red-600" },
                { label: "Mevcut Yurt", val: f.eay_mevcutYurt, color: "text-teal-600" },
                { label: "Toplam Ziyaret", val: f.eay_toplamZiyaret, color: "text-gray-600" },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center rounded-lg p-3" style={{ background: "var(--bg-page)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <p className={`text-2xl font-black mt-1 ${color}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
