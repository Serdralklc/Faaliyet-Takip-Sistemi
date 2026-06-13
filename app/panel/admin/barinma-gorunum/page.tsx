export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { barinmaGorunumYanRol } from "@/lib/constants";
import { BarinmaGorunumClient } from "./BarinmaGorunumClient";

export default async function BarinmaGorunumPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  const { anaRol, yanRoller, role } = session.user;
  const isAdmin = anaRol === "ADMIN" || role === "SISTEM_ADMIN";
  if (!isAdmin && !barinmaGorunumYanRol(yanRoller)) redirect("/panel/admin");

  return <BarinmaGorunumClient />;
}
