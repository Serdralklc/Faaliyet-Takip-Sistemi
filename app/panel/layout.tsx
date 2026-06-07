export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MobileLayout } from "@/components/MobileLayout";
import { Sidebar } from "@/components/Sidebar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  return (
    <MobileLayout user={session.user}>
      {children}
    </MobileLayout>
  );
}
