"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function SifreSifirlaForm() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const tip = searchParams.get("tip") === "gonullu" ? "gonullu" : "yonetici";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const girisHref = tip === "gonullu" ? "/gonullu/giris" : "/giris";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Şifre en az 8 karakter olmalı."); return; }
    if (password !== confirm) { setError("Şifreler eşleşmiyor."); return; }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/sifre-sifirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tip, password }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "İşlem başarısız. Lütfen tekrar deneyin.");
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthCard
      title="Yeni Şifre Belirle"
      subtitle="Hesabınız için yeni bir şifre oluşturun. Şifreniz en az 8 karakter olmalıdır."
      backHref={girisHref}
      backLabel="Giriş sayfasına dön"
    >
      {done ? (
        <div className="space-y-4">
          <div
            role="status"
            className="rounded-xl px-4 py-4 text-[14px] leading-relaxed"
            style={{ background: "var(--green-light)", color: "var(--accent)", border: "1px solid var(--green-muted)" }}
          >
            <p className="font-bold mb-1">Şifreniz güncellendi.</p>
            <p>Artık yeni şifrenizle giriş yapabilirsiniz.</p>
          </div>
          <Link href={girisHref} className="block">
            <Button className="w-full" size="lg">Giriş Yap</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            label="Yeni Şifre"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus
            hint="En az 8 karakter."
          />
          <Input
            type="password"
            label="Yeni Şifre (Tekrar)"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            error={error || undefined}
          />
          <Button type="submit" loading={sending} className="w-full" size="lg">
            Şifreyi Güncelle
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function SifreSifirlaPage() {
  return (
    <Suspense fallback={null}>
      <SifreSifirlaForm />
    </Suspense>
  );
}
