export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  const { role } = session.user;
  if (["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(role)) redirect("/panel/admin");
  if (role === "TURKIYE_SORUMLUSU") redirect("/panel/turkiye");
  if (role === "BOLGE_SORUMLUSU") redirect("/panel/bolge");
  if (role === "IL_SORUMLUSU") redirect("/panel/il");

  redirect("/panel/beklemede");
}
