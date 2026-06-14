export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { YONETICI_ROLLERI, formYonetimiYanRol } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { VeriTabloBuilder } from "../VeriTabloBuilder";

export default async function YeniVeriTabloPage({
  searchParams,
}: {
  searchParams: Promise<{ sablon?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!YONETICI_ROLLERI.includes(session.user.role as Role)) redirect("/");
  if (session.user.role === "GENEL_MERKEZ" && !formYonetimiYanRol(session.user.yanRoller)) redirect("/panel/admin");
  const { sablon } = await searchParams;
  return <VeriTabloBuilder sablonId={sablon} />;
}
