import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ozelAlanlariGetir } from "@/lib/ozel-alan";

export const dynamic = "force-dynamic";

/** Gençlik giriş formlarının okuduğu özel alan tanımları. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sistem = String(searchParams.get("sistem") ?? "");
  if (sistem !== "UNIVERSITE" && sistem !== "LISE") {
    return NextResponse.json({ error: "Geçersiz sistem." }, { status: 400 });
  }

  const alanlar = await ozelAlanlariGetir(sistem);
  return NextResponse.json({ sistem, alanlar });
}
