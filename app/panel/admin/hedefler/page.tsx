export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminHedeflerClient from "./AdminHedeflerClient";

export default async function AdminHedeflerPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  const allowed = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  if (!allowed.includes(session.user.role)) redirect("/");
  // İçerik ekranı: İçerik Yöneticisi yetkisi olmayan Merkez Ekip giremez
  if (session.user.role === "GENEL_MERKEZ" && !session.user.icerikYoneticisi) redirect("/panel/admin");

  const bolgeler = await prisma.bolge.findMany({
    orderBy: { no: "asc" },
    include: {
      hedefler: {
        orderBy: [{ yil: "desc" }, { donem: "asc" }],
        include: {
          ilHedef: { include: { il: { select: { id: true, ad: true } } } },
        },
      },
      iller: { orderBy: { ad: "asc" }, select: { id: true, ad: true } },
    },
  });

  return <AdminHedeflerClient bolgeler={bolgeler} />;
}
