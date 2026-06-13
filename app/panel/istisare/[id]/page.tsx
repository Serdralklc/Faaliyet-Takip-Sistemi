export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TalepThread } from "../TalepThread";
import { TALEP_OLUSTURAN_ROLLERI, TALEP_PANEL_ROLLERI } from "@/lib/istisare";

export default async function TalepDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  const { role } = session.user;
  if (![...TALEP_OLUSTURAN_ROLLERI, ...TALEP_PANEL_ROLLERI].includes(role)) redirect("/");

  const { id } = await params;
  return <TalepThread talepId={id} meId={session.user.id} role={role} yanRoller={session.user.yanRoller} />;
}
