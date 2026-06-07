import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import AdminGonullulerClient from "./AdminGonullulerClient";

export const dynamic = "force-dynamic";


export default async function AdminGonullulerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/giris");
  const role = session.user.role ?? "";
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(role)) redirect("/panel");

  const [gonulluler, bursBasvurulari, geriBildirimler] = await Promise.all([
    prisma.volunteer.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, adSoyad: true, telefon: true, email: true,
        ogrenim: true, ogrenimTuru: true, okul: true, bolum: true, il: true, createdAt: true,
        _count: { select: { bursBasvurulari: true, geriBildirimler: true } },
      },
    }),
    prisma.bursBasvuru.findMany({
      orderBy: { createdAt: "desc" },
      include: { volunteer: { select: { adSoyad: true, telefon: true } } },
    }),
    prisma.geriBildirim.findMany({
      orderBy: { createdAt: "desc" },
      include: { volunteer: { select: { adSoyad: true, telefon: true } } },
    }),
  ]);

  const stats = {
    toplamGonullu:  gonulluler.length,
    toplamBurs:     bursBasvurulari.length,
    bekleyenBurs:   bursBasvurulari.filter(b => b.durum === "BEKLEMEDE").length,
    onaylananBurs:  bursBasvurulari.filter(b => b.durum === "ONAYLANDI").length,
    toplamFeedback: geriBildirimler.length,
    buAyFeedback:   geriBildirimler.filter(g => {
      const ay = new Date(); ay.setDate(1);
      return new Date(g.createdAt) >= ay;
    }).length,
  };

  return (
    <AdminGonullulerClient
      initialGonulluler={JSON.parse(JSON.stringify(gonulluler))}
      initialBurslar={JSON.parse(JSON.stringify(bursBasvurulari))}
      initialFeedbackler={JSON.parse(JSON.stringify(geriBildirimler))}
      stats={stats}
    />
  );
}
