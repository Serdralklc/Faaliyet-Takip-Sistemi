export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function BolgelerPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU"].includes(session.user.role)) redirect("/");

  const bolgeler = await prisma.bolge.findMany({
    orderBy: { ad: "asc" },
    include: {
      iller: {
        include: {
          assignments: { where: { status: "AKTIF" }, include: { user: true }, take: 1 },
          activities: { orderBy: [{ yil: "desc" }, { donem: "asc" }], take: 1 },
        },
        orderBy: { ad: "asc" },
      },
    },
  });

  const toplamIl = bolgeler.reduce((s, b) => s + b.iller.length, 0);
  const veriGirilmis = bolgeler.reduce((s, b) => s + b.iller.filter(i => i.activities.length > 0).length, 0);
  const sorumlulu = bolgeler.reduce((s, b) => s + b.iller.filter(i => i.assignments.length > 0).length, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bölgeler & İller</h1>
        <p className="text-gray-500 text-sm mt-1">Türkiye geneli bölge ve il durumu</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600">Toplam İl</p>
          <p className="text-3xl font-bold text-blue-800">{toplamIl}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600">Veri Girilmiş</p>
          <p className="text-3xl font-bold text-green-800">{veriGirilmis}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-600">Sorumlu Atanmış</p>
          <p className="text-3xl font-bold text-purple-800">{sorumlulu}</p>
        </div>
      </div>

      <div className="space-y-6">
        {bolgeler.map((bolge) => {
          const bolgeVeri = bolge.iller.filter(i => i.activities.length > 0).length;
          const bolgeSorumlu = bolge.iller.filter(i => i.assignments.length > 0).length;
          return (
            <div key={bolge.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">{bolge.ad}</h2>
                  <p className="text-xs text-gray-500">{bolge.iller.length} il</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-700 font-medium">{bolgeVeri} veri var</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-red-600 font-medium">{bolge.iller.length - bolgeVeri} veri yok</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-purple-700 font-medium">{bolgeSorumlu} sorumlu</span>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">İl</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Sorumlu</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Son Faaliyet</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bolge.iller.map((il) => {
                    const sorumlu = il.assignments[0]?.user;
                    const sonFaaliyet = il.activities[0];
                    return (
                      <tr key={il.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{il.ad}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {sorumlu ? `${sorumlu.ad} ${sorumlu.soyad}` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {sonFaaliyet
                            ? `${sonFaaliyet.yil} / ${sonFaaliyet.donem === "DONEM_1" ? "1. Dönem" : sonFaaliyet.donem === "DONEM_2" ? "2. Dönem" : "Yaz"}`
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            il.activities.length > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            {il.activities.length > 0 ? "Veri Var" : "Veri Yok"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
