export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EkKayitPanel } from "@/components/EkKayitPanel";

export default async function BolgeEkKayitPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");

  return <EkKayitPanel baslik={`${session.user.activeBolgeAd ?? "Bölge"} — Ev / Yurt Başvuruları`} />;
}
