export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function LoglarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  const { role, sistem } = session.user;
  const YETKILI = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU"];
  if (!YETKILI.includes(role)) redirect("/");

  // TURKIYE_SORUMLUSU yalnızca kendi sistemindeki kullanıcıların loglarını görür
  const sistemFilter = (role === "TURKIYE_SORUMLUSU" && sistem)
    ? { user: { sistem: sistem as never } }
    : {};

  const loglar = await prisma.auditLog.findMany({
    where: sistemFilter,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });

  const actionLabel: Record<string, string> = {
    KULLANICI_OLUSTURULDU: "Kayıt",
    KULLANICI_DAVET_EDILDI: "Davet Gönderildi",
    KULLANICI_ONAYLANDI: "Onaylandı",
    KULLANICI_REDDEDILDI: "Reddedildi",
    SIFRE_OLUSTURULDU: "Şifre Oluşturuldu",
    ROL_DEGISTIRILDI: "Rol Değiştirildi",
    IL_ATANDI: "İl Atandı",
    BOLGE_ATANDI: "Bölge Atandı",
    GOREV_DEVRI_YAPILDI: "Görev Devri",
    KULLANICI_PASIFLESTIRILDI: "Pasifleştirildi",
    FAALIYET_OLUSTURULDU: "Faaliyet Eklendi",
    FAALIYET_GUNCELLENDI: "Faaliyet Güncellendi",
    FAALIYET_SILINDI: "Faaliyet Silindi",
  };

  const actionColor: Record<string, string> = {
    KULLANICI_OLUSTURULDU: "bg-blue-100 text-blue-700",
    KULLANICI_DAVET_EDILDI: "bg-indigo-100 text-indigo-700",
    KULLANICI_ONAYLANDI: "bg-green-100 text-green-700",
    KULLANICI_REDDEDILDI: "bg-red-100 text-red-700",
    GOREV_DEVRI_YAPILDI: "bg-purple-100 text-purple-700",
    FAALIYET_OLUSTURULDU: "bg-emerald-100 text-emerald-700",
    FAALIYET_GUNCELLENDI: "bg-yellow-100 text-yellow-700",
    FAALIYET_SILINDI: "bg-red-100 text-red-700",
    KULLANICI_PASIFLESTIRILDI: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Denetim Logları</h1>
        <p className="text-gray-500 text-sm mt-1">Son 200 sistem işlemi (değiştirilemez kayıt)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Tarih/Saat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">İşlem</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Kullanan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Kayıt Türü</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Açıklama</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">IP Adresi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loglar.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("tr-TR")}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColor[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                    {actionLabel[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {log.user ? `${log.user.ad} ${log.user.soyad}` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{log.entity}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                  {log.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                  {log.ipAddress ?? "—"}
                </td>
              </tr>
            ))}
            {loglar.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Henüz log kaydı yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
