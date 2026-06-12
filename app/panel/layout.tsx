export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { MobileLayout } from "@/components/MobileLayout";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  // Merkez Ekip + İçerik Yöneticisi kullanıcıları için aktif görünüm (cookie ile)
  const ck = await cookies();
  const aktifGorunum: "merkez" | "icerik" =
    ck.get("panel-gorunum")?.value === "icerik" ? "icerik" : "merkez";

  return (
    <MobileLayout user={session.user} aktifGorunum={aktifGorunum}>
      {children}
    </MobileLayout>
  );
}
