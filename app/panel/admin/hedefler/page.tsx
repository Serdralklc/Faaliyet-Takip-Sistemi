export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminHedeflerClient from "./AdminHedeflerClient";
import { GenclikHedefEditor } from "@/components/GenclikHedefEditor";
import { hedefMetrikleri, type GenclikSistem } from "@/lib/genclik-hedef";

type SistemKey = "EGITIMCI" | "UNIVERSITE" | "LISE";

function SistemSekmeleri({ aktif, goster }: { aktif: SistemKey; goster: SistemKey[] }) {
  const tum: { key: SistemKey; label: string; renk: string }[] = [
    { key: "EGITIMCI",   label: "Eğitimci",          renk: "#0B6B3A" },
    { key: "UNIVERSITE", label: "Üniversite Gençlik", renk: "#1D4ED8" },
    { key: "LISE",       label: "Lise Gençlik",       renk: "#7C3AED" },
  ];
  const sek = tum.filter(s => goster.includes(s.key));
  if (sek.length < 2) return null;
  return (
    <div className="flex gap-1 px-6 pt-4 flex-wrap">
      {sek.map(s => {
        const on = aktif === s.key;
        return (
          <Link key={s.key} href={`/panel/admin/hedefler?sistem=${s.key}`}
            className="px-4 py-2 rounded-xl text-sm font-bold transition"
            style={on ? { background: s.renk, color: "#fff" } : { background: "var(--bg-hover)", color: "var(--text-muted)" }}>
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function AdminHedeflerPage({ searchParams }: {
  searchParams: Promise<{ sistem?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  const allowed = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  if (!allowed.includes(session.user.role)) redirect("/");
  // İçerik ekranı: İçerik Yöneticisi yetkisi olmayan Merkez Ekip giremez
  if (session.user.role === "GENEL_MERKEZ" && !session.user.icerikYoneticisi) redirect("/panel/admin");

  const { role } = session.user;
  const isFullAdmin = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU"].includes(role);
  const roleSistem: SistemKey | null =
    role === "TURKIYE_UNIVERSITE_SORUMLUSU" ? "UNIVERSITE" :
    role === "TURKIYE_LISE_SORUMLUSU"       ? "LISE" : null;

  const sp = await searchParams;
  const reqSistem = sp.sistem === "UNIVERSITE" || sp.sistem === "LISE" || sp.sistem === "EGITIMCI" ? sp.sistem : null;
  const sistem: SistemKey = roleSistem ?? (reqSistem as SistemKey) ?? "EGITIMCI";

  const gosterSekmeler: SistemKey[] = isFullAdmin ? ["EGITIMCI", "UNIVERSITE", "LISE"] : [sistem];

  // ── Üniversite / Lise Gençlik: kategori-bazlı bölge muradı editörü ──
  if (sistem === "UNIVERSITE" || sistem === "LISE") {
    const sis = sistem as GenclikSistem;
    const [bolgeler, faalYillar] = await Promise.all([
      prisma.bolge.findMany({ orderBy: { no: "asc" }, select: { id: true, no: true, ad: true } }),
      sis === "UNIVERSITE"
        ? prisma.universiteFaaliyet.findMany({ distinct: ["yil"], select: { yil: true }, orderBy: { yil: "desc" } })
        : prisma.liseFaaliyet.findMany({ distinct: ["yil"], select: { yil: true }, orderBy: { yil: "desc" } }),
    ]);
    const yillar = [...new Set([new Date().getFullYear(), ...faalYillar.map(y => y.yil)])].sort((a, b) => b - a);
    return (
      <>
        <SistemSekmeleri aktif={sistem} goster={gosterSekmeler} />
        <GenclikHedefEditor
          baslik="Muradımız"
          altBaslik={`${sis === "UNIVERSITE" ? "Üniversite" : "Lise"} Gençlik — bölge bazlı kategori muradı belirleyin`}
          sistem={sis}
          scope="bolge"
          entities={bolgeler}
          metrikler={hedefMetrikleri(sis)}
          yillar={yillar}
        />
      </>
    );
  }

  // ── Eğitimci (mevcut yapı) ──
  const bolgeler = await prisma.bolge.findMany({
    orderBy: { no: "asc" },
    include: {
      hedefler: {
        orderBy: [{ yil: "desc" }, { donem: "asc" }],
        include: {
          ilHedef: { include: { il: { select: { id: true, ad: true } } } },
        },
      },
      iller: { orderBy: { ad: "asc" }, select: { id: true, ad: true } },
    },
  });

  return (
    <>
      <SistemSekmeleri aktif="EGITIMCI" goster={gosterSekmeler} />
      <AdminHedeflerClient bolgeler={bolgeler} />
    </>
  );
}
