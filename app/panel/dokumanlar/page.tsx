export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DokumanViewerClient } from "./DokumanViewerClient";

/**
 * Bölge / il sorumlusu doküman görüntüleyici — salt okunur.
 * Yönetici rolleri tam yetkili Doküman Merkezi'ne yönlendirilir.
 */
export default async function PanelDokumanlarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  const role = session.user.role;
  if (role !== "BOLGE_SORUMLUSU" && role !== "IL_SORUMLUSU") {
    redirect("/panel/admin/dokumanlar");
  }

  return <DokumanViewerClient />;
}
