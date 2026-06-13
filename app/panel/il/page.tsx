export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import IlDashboardClient from "./IlDashboardClient";
import { GenclikIlDashboard } from "./GenclikIlDashboard";

export default async function IlDashboard() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "IL_SORUMLUSU") redirect("/");

  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");

  // Lise / Üniversite Gençlik il sorumlusu: kendi faaliyet verisinden analizli Ana Sayfa
  const sistem = session.user.sistem;
  if (sistem === "UNIVERSITE" || sistem === "LISE") {
    const ilG = await prisma.il.findUnique({ where: { id: ilId }, include: { bolge: true } });
    if (!ilG) redirect("/panel/beklemede");
    const ham = sistem === "UNIVERSITE"
      ? await prisma.universiteFaaliyet.findMany({ where: { ilId }, orderBy: { tarih: "desc" },
          select: { id: true, tarih: true, yil: true, donem: true, kategori: true, faaliyetAdi: true, katilimci: true, ilkKezKatilan: true, yeniIntisap: true } })
      : await prisma.liseFaaliyet.findMany({ where: { ilId }, orderBy: { tarih: "desc" },
          select: { id: true, tarih: true, yil: true, donem: true, kategori: true, faaliyetAdi: true, katilimci: true, ilkKezKatilan: true, yeniIntisap: true } });
    const faaliyetler = ham.map(f => ({
      id: f.id, tarih: f.tarih.toISOString(), yil: f.yil, donem: String(f.donem),
      kategori: String(f.kategori), faaliyetAdi: f.faaliyetAdi,
      katilimci: f.katilimci, ilkKezKatilan: f.ilkKezKatilan, yeniIntisap: f.yeniIntisap,
    }));
    return <GenclikIlDashboard sistem={sistem} ilAd={ilG.ad} bolgeAd={ilG.bolge.ad} faaliyetler={faaliyetler} />;
  }

  const [il, faaliyetler, evSayisi, apartSayisi, yurtSayisi, ziyaretSayisi, ilHedefler,
    toplamOgrenci, nezirBursu] = await Promise.all([
    prisma.il.findUnique({ where: { id: ilId }, include: { bolge: true } }),
    prisma.activity.findMany({
      where: { ilId },
      orderBy: [{ yil: "desc" }, { donem: "asc" }],
    }),
    prisma.housingUnit.count({ where: { ilId, tip: "EV",    aktif: true } }),
    prisma.housingUnit.count({ where: { ilId, tip: "APART", aktif: true } }),
    prisma.housingUnit.count({ where: { ilId, tip: "YURT",  aktif: true } }),
    prisma.housingVisit.count({ where: { housingUnit: { ilId } } }),
    prisma.ilHedef.findMany({
      where: { ilId },
      orderBy: [{ yil: "desc" }, { donem: "asc" }],
    }),
    prisma.housingStudent.count({ where: { housingUnit: { ilId } } }),
    prisma.housingStudent.count({ where: { housingUnit: { ilId }, bursMu: true } }),
  ]);

  if (!il) redirect("/panel/beklemede");

  return (
    <IlDashboardClient
      il={il}
      faaliyetler={faaliyetler}
      evSayisi={evSayisi}
      apartSayisi={apartSayisi}
      yurtSayisi={yurtSayisi}
      ziyaretSayisi={ziyaretSayisi}
      ilHedefler={ilHedefler}
      toplamOgrenciBarinma={toplamOgrenci}
      nezirBursuSayisi={nezirBursu}
    />
  );
}
