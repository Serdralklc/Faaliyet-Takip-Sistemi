export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FaaliyetYapilandirmaClient } from "./FaaliyetYapilandirmaClient";

export default async function FaaliyetYapilandirmaPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  // Yalnızca Sistem Admini + İçerik Yöneticisi
  const u = session.user;
  const yetkili = u.role === "SISTEM_ADMIN" || u.icerikYoneticisi;
  if (!yetkili) redirect("/panel/admin");

  return <FaaliyetYapilandirmaClient />;
}
