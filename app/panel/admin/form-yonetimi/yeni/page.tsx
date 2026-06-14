export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { YONETICI_ROLLERI, rolSistemi } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { FormBuilder } from "../FormBuilder";

export default async function YeniFormPage({
  searchParams,
}: {
  searchParams: Promise<{ sablon?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!YONETICI_ROLLERI.includes(session.user.role as Role)) redirect("/");

  const { sablon } = await searchParams;
  return <FormBuilder sablonId={sablon} kisitliSistem={rolSistemi(session.user.role)} />;
}
