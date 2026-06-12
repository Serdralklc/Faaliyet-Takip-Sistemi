export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SUPER_ADMIN_ROLLERI } from "@/lib/constants";
import VeriImportClient from "./VeriImportClient";

export default async function VeriImportPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!SUPER_ADMIN_ROLLERI.includes(session.user.role)) redirect("/");

  const iller = await prisma.il.findMany({
    orderBy: { ad: "asc" },
    select: { id: true, ad: true, bolge: { select: { ad: true } } },
  });

  return (
    <VeriImportClient
      iller={iller.map((i) => ({ id: i.id, ad: i.ad, bolgeAd: i.bolge.ad }))}
    />
  );
}
