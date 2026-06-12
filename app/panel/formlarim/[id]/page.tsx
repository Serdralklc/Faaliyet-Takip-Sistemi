export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FormDoldurClient } from "./FormDoldurClient";

/** Form doldurma / yanıt görüntüleme — bölge ve il sorumluları */
export default async function FormDoldurPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  const role = session.user.role;
  if (role !== "BOLGE_SORUMLUSU" && role !== "IL_SORUMLUSU") {
    redirect("/panel/admin/form-yonetimi");
  }

  const { id } = await params;
  return <FormDoldurClient formId={id} />;
}
