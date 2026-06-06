export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
