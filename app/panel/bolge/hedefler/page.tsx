export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BolgeHedeflerClient from "./BolgeHedeflerClient";
import { GenclikHedefEditor } from "@/components/GenclikHedefEditor";
import { hedefMetrikleri, type GenclikSistem } from "@/lib/genclik-hedef";

export default async function BolgeHedeflerPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "BOLGE_SORUMLUSU") redirect("/");

  const bolgeId = session.user.activeBolgeId;
  if (!bolgeId) redirect("/panel/beklemede");

  // Üniversite / Lise Gençlik bölge sorumlusu: kategori-bazlı il muradı editörü
  if (session.user.sistem === "UNIVERSITE" || session.user.sistem === "LISE") {
    const sis = session.user.sistem as GenclikSistem;
    const bolge = await prisma.bolge.findUnique({
      where: { id: bolgeId },
      include: { iller: { orderBy: { ad: "asc" }, select: { id: true, ad: true } } },
    });
    if (!bolge) redirect("/panel/beklemede");
    const yillar = [...new Set([new Date().getFullYear()])].sort((a, b) => b - a);
    return (
      <GenclikHedefEditor
        baslik="Muradımız Dağıtımı"
        altBaslik={`${bolge.ad} · ${sis === "UNIVERSITE" ? "Üniversite" : "Lise"} Gençlik — illere kategori muradı belirleyin`}
        sistem={sis}
        scope="il"
        entities={bolge.iller}
        metrikler={hedefMetrikleri(sis)}
        yillar={yillar}
        bolgeId={bolgeId}
      />
    );
  }

  const [bolge, bolgeHedefler] = await Promise.all([
    prisma.bolge.findUnique({
      where: { id: bolgeId },
      include: { iller: { orderBy: { ad: "asc" }, select: { id: true, ad: true } } },
    }),
    prisma.bolgeHedef.findMany({
      where: { bolgeId },
      orderBy: [{ yil: "desc" }, { donem: "asc" }],
      include: {
        ilHedef: { include: { il: { select: { id: true, ad: true } } } },
      },
    }),
  ]);

  if (!bolge) redirect("/panel/beklemede");

  return (
    <BolgeHedeflerClient
      bolge={bolge}
      bolgeHedefler={bolgeHedefler}
    />
  );
}
