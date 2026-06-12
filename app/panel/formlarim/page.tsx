export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FormlarimClient } from "./FormlarimClient";

/**
 * Bölge / il sorumlusu form doldurma listesi.
 * Yönetici rolleri tam yetkili Form Yönetimi'ne yönlendirilir.
 */
export default async function FormlarimPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  const role = session.user.role;
  if (role !== "BOLGE_SORUMLUSU" && role !== "IL_SORUMLUSU") {
    redirect("/panel/admin/form-yonetimi");
  }

  return <FormlarimClient />;
}
