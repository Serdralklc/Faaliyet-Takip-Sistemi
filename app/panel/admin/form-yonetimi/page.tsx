export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { YONETICI_ROLLERI, formYonetimiYanRol } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { FormListClient } from "./FormListClient";

export default async function FormYonetimiPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!YONETICI_ROLLERI.includes(session.user.role as Role)) redirect("/");
  // Form Yönetimi: Merkez ana rolünde yalnızca Form yan rolü olanlar girer
  if (session.user.role === "GENEL_MERKEZ" && !formYonetimiYanRol(session.user.yanRoller)) redirect("/panel/admin");

  return <FormListClient />;
}
