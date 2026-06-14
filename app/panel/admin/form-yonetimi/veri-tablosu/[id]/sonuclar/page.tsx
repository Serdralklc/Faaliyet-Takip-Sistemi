export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { YONETICI_ROLLERI, formYonetimiYanRol } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { VeriTabloSonuclarClient } from "./VeriTabloSonuclarClient";

export default async function VeriTabloSonuclarPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!YONETICI_ROLLERI.includes(session.user.role as Role)) redirect("/");
  if (session.user.role === "GENEL_MERKEZ" && !formYonetimiYanRol(session.user.yanRoller)) redirect("/panel/admin");
  const { id } = await params;
  return <VeriTabloSonuclarClient tabloId={id} />;
}
