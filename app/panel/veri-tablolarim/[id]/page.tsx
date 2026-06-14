export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VeriTabloDoldurClient } from "./VeriTabloDoldurClient";

export default async function VeriTabloDoldurPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  // Yalnız bölge/il sorumluları veri tablosu doldurur (API ayrıca görünürlük kontrolü yapar)
  if (session.user.role !== "BOLGE_SORUMLUSU" && session.user.role !== "IL_SORUMLUSU") redirect("/");
  const { id } = await params;
  return <VeriTabloDoldurClient tabloId={id} />;
}
