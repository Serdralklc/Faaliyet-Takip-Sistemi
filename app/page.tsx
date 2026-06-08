export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { HomePage } from "@/components/HomePage";

export default async function Home() {
  const session = await getSession();

  // Oturumu açık kullanıcılar doğrudan panele
  if (session?.user) {
    const { role } = session.user;
    if (["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"].includes(role)) redirect("/panel/admin");
    if (role === "BOLGE_SORUMLUSU") redirect("/panel/bolge");
    if (role === "IL_SORUMLUSU") redirect("/panel/il");
    if (role === "BEKLEYEN") redirect("/profil-tamamla");
    redirect("/panel/beklemede");
  }

  return <HomePage />;
}
