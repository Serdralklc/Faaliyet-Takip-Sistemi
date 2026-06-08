export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BursBasvurulariClient } from "./BursBasvurulariClient";

export default async function BursBasvurulariPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"].includes(session.user.role)) redirect("/");

  const basvurular = await prisma.bursBasvuru.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      volunteer: { select: { id: true, adSoyad: true, telefon: true, email: true } },
    },
  });

  const stats = {
    toplam:     basvurular.length,
    bekleyen:   basvurular.filter(b => b.durum === "BEKLEMEDE").length,
    inceleniyor: basvurular.filter(b => b.durum === "INCELENIYOR").length,
    onaylandi:  basvurular.filter(b => b.durum === "ONAYLANDI").length,
    reddedildi: basvurular.filter(b => b.durum === "REDDEDILDI").length,
  };

  return (
    <BursBasvurulariClient
      basvurular={basvurular.map(b => ({
        id:           b.id,
        adSoyad:      b.adSoyad,
        telefon:      b.telefon,
        email:        b.email,
        universite:   b.universite,
        fakulteBolum: b.fakulteBolum,
        sinif:        b.sinif,
        il:           b.il,
        madiDurum:    b.madiDurum,
        aciklama:     b.aciklama,
        belgeler:     b.belgeler,
        durum:        b.durum,
        yoneticiNotu: b.yoneticiNotu,
        createdAt:    b.createdAt.toISOString(),
        volunteer:    b.volunteer,
      }))}
      stats={stats}
    />
  );
}
