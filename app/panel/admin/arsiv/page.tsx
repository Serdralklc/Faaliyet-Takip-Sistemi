export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SUPER_ADMIN_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { ArsivClient } from "./ArsivClient";

export default async function ArsivPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!SUPER_ADMIN_ROLLERI.includes(session.user.role as Role)) redirect("/panel/admin");
  // İçerik ekranı: İçerik Yöneticisi yetkisi olmayan Merkez Ekip giremez
  if (session.user.role === "GENEL_MERKEZ" && !session.user.icerikYoneticisi) redirect("/panel/admin");

  return <ArsivClient />;
}
