export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { DokumanMerkeziClient } from "./DokumanMerkeziClient";

export default async function DokumanlarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!YONETICI_ROLLERI.includes(session.user.role as Role)) redirect("/");
  // Doküman Merkezi tüm yönetim rollerine açık; yönetme (yükle/sil/erişim) yetkisi
  // içeride API'de admin + İçerik Yöneticisi ile sınırlı, görüntüle/indir/paylaş herkese.

  return <DokumanMerkeziClient />;
}
