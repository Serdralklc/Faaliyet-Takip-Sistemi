import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { genclikKategoriYapisi, type GenclikSistem } from "@/lib/genclik-kategori";

export const dynamic = "force-dynamic";

/** Gençlik giriş formlarının okuduğu birleşik kategori + faaliyet türü yapısı. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sistemRaw = String(searchParams.get("sistem") ?? "");
  if (sistemRaw !== "UNIVERSITE" && sistemRaw !== "LISE") {
    return NextResponse.json({ error: "Geçersiz sistem." }, { status: 400 });
  }

  const kategoriler = await genclikKategoriYapisi(sistemRaw as GenclikSistem);
  return NextResponse.json({ sistem: sistemRaw, kategoriler });
}
