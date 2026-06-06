export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem",
  DONEM_2: "2. Dönem",
  YAZ_DONEMI: "Yaz Dönemi",
};

export default async function RaporlarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU"].includes(session.user.role)) redirect("/");

  const bolgeler = await prisma.bolge.findMany({
    orderBy: { ad: "asc" },
    include: {
      iller: {
        include: {
          activities: { orderBy: [{ yil: "desc" }, { donem: "asc" }] },
        },
      },
    },
  });

  // Mevcut yıl/dönem kombinasyonları
  const tumFaaliyetler = bolgeler.flatMap(b => b.iller.flatMap(i => i.activities));
  const yillar = [...new Set(tumFaaliyetler.map(f => f.yil))].sort((a, b) => b - a);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-gray-500 text-sm mt-1">Türkiye geneli faaliyet özeti</p>
        </div>
      </div>

      {yillar.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-lg">Henüz faaliyet kaydı bulunmuyor.</p>
          <p className="text-gray-300 text-sm mt-2">İl sorumluları faaliyet girdikçe burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {yillar.map((yil) => {
            const yilFaaliyetler = tumFaaliyetler.filter(f => f.yil === yil);
            const donemler = [...new Set(yilFaaliyetler.map(f => f.donem))].sort();

            return (
              <div key={yil}>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{yil} Yılı</h2>
                {donemler.map((donem) => {
                  const donemFaaliyetler = yilFaaliyetler.filter(f => f.donem === donem);

                  const toplamlar = {
                    ik_toplamDergah: donemFaaliyetler.reduce((s, f) => s + (f.ik_toplamDergah ?? 0), 0),
                    ik_toplamKisi: donemFaaliyetler.reduce((s, f) => s + (f.ik_toplamKisi ?? 0), 0),
                    lise_toplamDergah: donemFaaliyetler.reduce((s, f) => s + (f.lise_toplamDergah ?? 0), 0),
                    lise_toplamKisi: donemFaaliyetler.reduce((s, f) => s + (f.lise_toplamKisi ?? 0), 0),
                    uni_toplamDergah: donemFaaliyetler.reduce((s, f) => s + (f.uni_toplamDergah ?? 0), 0),
                    uni_toplamKisi: donemFaaliyetler.reduce((s, f) => s + (f.uni_toplamKisi ?? 0), 0),
                    ev_toplamHane: donemFaaliyetler.reduce((s, f) => s + (f.ev_toplamHane ?? 0), 0),
                    ev_toplamKisi: donemFaaliyetler.reduce((s, f) => s + (f.ev_toplamKisi ?? 0), 0),
                  };

                  return (
                    <div key={donem} className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                      <div className="bg-blue-50 border-b border-blue-100 px-5 py-3">
                        <h3 className="font-semibold text-blue-800">{DONEM_LABEL[donem]}</h3>
                        <p className="text-xs text-blue-500">{donemFaaliyetler.length} il verisi mevcut</p>
                      </div>

                      {/* Özet kartlar */}
                      <div className="grid grid-cols-4 gap-4 p-5 border-b border-gray-100">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">İlköğretim</p>
                          <p className="text-xl font-bold text-gray-800">{toplamlar.ik_toplamDergah}</p>
                          <p className="text-xs text-gray-500">dergah / {toplamlar.ik_toplamKisi} kişi</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Lise</p>
                          <p className="text-xl font-bold text-gray-800">{toplamlar.lise_toplamDergah}</p>
                          <p className="text-xs text-gray-500">dergah / {toplamlar.lise_toplamKisi} kişi</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Üniversite</p>
                          <p className="text-xl font-bold text-gray-800">{toplamlar.uni_toplamDergah}</p>
                          <p className="text-xs text-gray-500">dergah / {toplamlar.uni_toplamKisi} kişi</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Ev/Apart/Yurt</p>
                          <p className="text-xl font-bold text-gray-800">{toplamlar.ev_toplamHane}</p>
                          <p className="text-xs text-gray-500">hane / {toplamlar.ev_toplamKisi} kişi</p>
                        </div>
                      </div>

                      {/* Bölge bazlı tablo */}
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Bölge</th>
                            <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">İK Dergah</th>
                            <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">İK Kişi</th>
                            <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Lise Dergah</th>
                            <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Lise Kişi</th>
                            <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Üni Dergah</th>
                            <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Üni Kişi</th>
                            <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Ev Hane</th>
                            <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Ev Kişi</th>
                            <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Veri Giren</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {bolgeler.map((bolge) => {
                            const bolgeFaaliyetler = bolge.iller.flatMap(i =>
                              i.activities.filter(f => f.yil === yil && f.donem === donem)
                            );
                            if (bolgeFaaliyetler.length === 0) return null;
                            return (
                              <tr key={bolge.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-medium text-gray-700">{bolge.ad}</td>
                                <td className="px-4 py-2.5 text-center text-gray-600">{bolgeFaaliyetler.reduce((s, f) => s + (f.ik_toplamDergah ?? 0), 0)}</td>
                                <td className="px-4 py-2.5 text-center text-gray-600">{bolgeFaaliyetler.reduce((s, f) => s + (f.ik_toplamKisi ?? 0), 0)}</td>
                                <td className="px-4 py-2.5 text-center text-gray-600">{bolgeFaaliyetler.reduce((s, f) => s + (f.lise_toplamDergah ?? 0), 0)}</td>
                                <td className="px-4 py-2.5 text-center text-gray-600">{bolgeFaaliyetler.reduce((s, f) => s + (f.lise_toplamKisi ?? 0), 0)}</td>
                                <td className="px-4 py-2.5 text-center text-gray-600">{bolgeFaaliyetler.reduce((s, f) => s + (f.uni_toplamDergah ?? 0), 0)}</td>
                                <td className="px-4 py-2.5 text-center text-gray-600">{bolgeFaaliyetler.reduce((s, f) => s + (f.uni_toplamKisi ?? 0), 0)}</td>
                                <td className="px-4 py-2.5 text-center text-gray-600">{bolgeFaaliyetler.reduce((s, f) => s + (f.ev_toplamHane ?? 0), 0)}</td>
                                <td className="px-4 py-2.5 text-center text-gray-600">{bolgeFaaliyetler.reduce((s, f) => s + (f.ev_toplamKisi ?? 0), 0)}</td>
                                <td className="px-4 py-2.5 text-center text-gray-500 text-xs">{bolgeFaaliyetler.length} il</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
