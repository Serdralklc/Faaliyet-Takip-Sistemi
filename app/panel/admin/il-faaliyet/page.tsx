export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ilFaaliyetTakipYanRol, yanRolVar } from "@/lib/constants";
import { IlFaaliyetClient } from "./IlFaaliyetClient";

export default async function IlFaaliyetPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  const { anaRol, yanRoller, role } = session.user;
  const isAdmin = anaRol === "ADMIN" || role === "SISTEM_ADMIN";
  if (!isAdmin && !ilFaaliyetTakipYanRol(yanRoller)) redirect("/panel/admin");

  const hasUni = isAdmin || yanRolVar(yanRoller, "MERKEZ_UNI", "MERKEZ_UNI_GENCLIK", "TR_EGITIM", "TR_EGITIM_YRD");
  const hasLise = isAdmin || yanRolVar(yanRoller, "MERKEZ_LISE_GENCLIK", "MERKEZ_LISE", "TR_EGITIM", "TR_EGITIM_YRD");
  const sistemler: ("UNIVERSITE" | "LISE")[] = [
    ...(hasUni ? (["UNIVERSITE"] as const) : []),
    ...(hasLise ? (["LISE"] as const) : []),
  ];

  return <IlFaaliyetClient sistemler={sistemler} />;
}
