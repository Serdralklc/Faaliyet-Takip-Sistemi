export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IstisareClient } from "./IstisareClient";
import { TALEP_OLUSTURAN_ROLLERI, TALEP_PANEL_ROLLERI } from "@/lib/istisare";

export default async function IstisarePage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  const { role, sistem } = session.user;
  const olusturabilir = TALEP_OLUSTURAN_ROLLERI.includes(role);
  const panelci = TALEP_PANEL_ROLLERI.includes(role);
  if (!olusturabilir && !panelci) redirect("/");

  return <IstisareClient sistem={sistem} olusturabilir={olusturabilir} panelci={panelci} />;
}
