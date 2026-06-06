export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function IlPanelPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "IL_SORUMLUSU") redirect("/");

  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");

  const il = await prisma.il.findUnique({
    where: { id: ilId },
    include: { bolge: true },
  });

  const faaliyetler = await prisma.activity.findMany({
    where: { ilId },
    orderBy: [{ yil: "desc" }, { donem: "asc" }],
  });

  const donemLabel: Record<string, string> = {
    DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{il?.ad}</h1>
        <p className="text-gray-500">{il?.bolge.ad}</p>
      </div>

      <div className="flex gap-4 mb-8">
        <Link href="/panel/il/faaliyet-gir"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 text-sm font-medium">
          + Faaliyet Gir
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">Kayıtlı Faaliyetler</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Yıl</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Dönem</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Toplam Dergah (İK)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kayıt Eden</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tarih</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {faaliyetler.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{f.yil}</td>
                <td className="px-4 py-3">{donemLabel[f.donem]}</td>
                <td className="px-4 py-3 text-gray-600">{f.ik_toplamDergah}</td>
                <td className="px-4 py-3 text-gray-500">{f.createdByName}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(f.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/panel/il/faaliyet-gir?id=${f.id}`}
                    className="text-blue-600 hover:underline text-xs">Düzenle</Link>
                </td>
              </tr>
            ))}
            {faaliyetler.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Henüz faaliyet kaydı yok</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
