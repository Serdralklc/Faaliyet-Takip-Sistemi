export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { yanRolVar } from "@/lib/constants";
import { LiseHaritaClient } from "./LiseHaritaClient";

export default async function LiseHaritaPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  const { anaRol, yanRoller, role } = session.user;
  const izin =
    anaRol === "ADMIN" || role === "SISTEM_ADMIN" ||
    anaRol === "LISE_GENCLIK" || role === "TURKIYE_LISE_SORUMLUSU" ||
    yanRolVar(yanRoller, "MERKEZ_LISE", "MERKEZ_LISE_GENCLIK", "TR_EGITIM", "TR_EGITIM_YRD");
  if (!izin) redirect("/panel/admin");

  return <LiseHaritaClient />;
}
