export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function BolgePanelPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");

  const bolgeId = session.user.activeBolgeId;
  if (!bolgeId) redirect("/panel/beklemede");

  const bolge = await prisma.bolge.findUnique({
    where: { id: bolgeId },
    include: {
      iller: {
        include: {
          activities: { orderBy: [{ yil: "desc" }, { donem: "asc" }], take: 1 },
          assignments: { where: { status: "AKTIF" }, include: { user: true }, take: 1 },
        },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{bolge?.ad}</h1>
        <p className="text-gray-500">Bölge Özeti</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600">Toplam İl</p>
          <p className="text-3xl font-bold text-blue-800">{bolge?.iller.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600">Veri Girilmiş</p>
          <p className="text-3xl font-bold text-green-800">
            {bolge?.iller.filter((i) => i.activities.length > 0).length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-600">Veri Girilmemiş</p>
          <p className="text-3xl font-bold text-yellow-800">
            {bolge?.iller.filter((i) => i.activities.length === 0).length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-600">Sorumlu Atanmış</p>
          <p className="text-3xl font-bold text-purple-800">
            {bolge?.iller.filter((i) => i.assignments.length > 0).length}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">İller</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">İl</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sorumlu</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Son Veri</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bolge?.iller.map((il) => {
              const sorumlu = il.assignments[0]?.user;
              const sonFaaliyet = il.activities[0];
              return (
                <tr key={il.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{il.ad}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {sorumlu ? `${sorumlu.ad} ${sorumlu.soyad}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {sonFaaliyet ? `${sonFaaliyet.yil} / ${sonFaaliyet.donem === "DONEM_1" ? "1. Dönem" : sonFaaliyet.donem === "DONEM_2" ? "2. Dönem" : "Yaz"}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      il.activities.length > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
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
    </div>
  );
}
