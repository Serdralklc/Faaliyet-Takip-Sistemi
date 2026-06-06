export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function LoglarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "SISTEM_ADMIN") redirect("/");

  const loglar = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });

  const actionLabel: Record<string, string> = {
    USER_REGISTERED: "Kayıt",
    USER_APPROVED: "Onaylandı",
    USER_REJECTED: "Reddedildi",
    TASK_TRANSFERRED: "Görev Devri",
    ACTIVITY_CREATED: "Faaliyet Eklendi",
    ACTIVITY_UPDATED: "Faaliyet Güncellendi",
    ACTIVITY_DELETED: "Faaliyet Silindi",
    INVITATION_SENT: "Davet Gönderildi",
  };

  const actionColor: Record<string, string> = {
    USER_REGISTERED: "bg-blue-100 text-blue-700",
    USER_APPROVED: "bg-green-100 text-green-700",
    USER_REJECTED: "bg-red-100 text-red-700",
    TASK_TRANSFERRED: "bg-purple-100 text-purple-700",
    ACTIVITY_CREATED: "bg-emerald-100 text-emerald-700",
    ACTIVITY_UPDATED: "bg-yellow-100 text-yellow-700",
    ACTIVITY_DELETED: "bg-red-100 text-red-700",
    INVITATION_SENT: "bg-indigo-100 text-indigo-700",
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
