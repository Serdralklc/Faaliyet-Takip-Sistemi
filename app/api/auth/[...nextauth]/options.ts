import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role, Sistem, MerkezGorev } from "@/app/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      ad: string;
      soyad: string;
      role: Role;
      sistem: Sistem;
      icerikYoneticisi: boolean;
      teknikYetkisi: boolean;
      merkezGorev: MerkezGorev | null;
      anaRol: string | null;
      yanRoller: string[];
      activeIlId?: string | null;
      activeBolgeId?: string | null;
      activeIlAd?: string | null;
      activeBolgeAd?: string | null;
    };
  }
  interface User {
    id: string;
    email: string;
    ad: string;
    soyad: string;
    role: Role;
    sistem: Sistem;
    icerikYoneticisi: boolean;
    teknikYetkisi: boolean;
    merkezGorev: MerkezGorev | null;
    anaRol: string | null;
    yanRoller: string[];
    activeIlId?: string | null;
    activeBolgeId?: string | null;
    activeIlAd?: string | null;
    activeBolgeAd?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    sistem: Sistem;
    icerikYoneticisi: boolean;
    teknikYetkisi: boolean;
    merkezGorev: MerkezGorev | null;
    anaRol: string | null;
    yanRoller: string[];
    ad: string;
    soyad: string;
    activeIlId?: string | null;
    activeBolgeId?: string | null;
    activeIlAd?: string | null;
    activeBolgeAd?: string | null;
  }
}

async function loadDbUser(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    include: {
      assignments: {
        where: { status: "AKTIF" },
        orderBy: { startedAt: "desc" },
        take: 1,
        include: { il: true, bolge: true },
      },
      anaRol: { select: { kod: true } },
      yanRoller: { select: { yanRol: { select: { kod: true } } } },
    },
  });
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "E-posta", type: "email"    },
        password: { label: "Sifre",   type: "password" },
        sistem:   { label: "Sistem",  type: "text"     },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await loadDbUser(credentials.email);
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Son aktiflik zamanını güncelle (giriş başarılı) — hata olsa da girişi engelleme
        prisma.user.update({ where: { id: user.id }, data: { sonAktif: new Date() } }).catch(() => {});

        const requestedSistem = credentials.sistem as string | undefined;

        // Yönetici kartından giriş: yönetici rolleri olmalı
        if (requestedSistem === "YONETICI") {
          const adminRoles = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "TEKNIK"];
          if (!adminRoles.includes(user.role)) {
            throw new Error("YONETICI_YETKISIZ");
          }
          // Session sistemi DB'deki sistem değeri olarak kalır
          const a = user.assignments[0];
          return {
            id: user.id, email: user.email, ad: user.ad, soyad: user.soyad,
            role: user.role, sistem: user.sistem, icerikYoneticisi: user.icerikYoneticisi,
            merkezGorev: user.merkezGorev, teknikYetkisi: user.teknikYetkisi,
            anaRol: user.anaRol?.kod ?? null, yanRoller: user.yanRoller.map(r => r.yanRol.kod),
            activeIlId: a?.ilId ?? null, activeBolgeId: a?.bolgeId ?? null,
            activeIlAd: a?.il?.ad ?? null, activeBolgeAd: a?.bolge?.ad ?? null,
          };
        }

        const sistemEnum = requestedSistem as Sistem | undefined;

        // Yönetici rolleri sadece YONETICI kartından girebilir
        const YONETICI_ROLLERI = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "TEKNIK"];
        if (YONETICI_ROLLERI.includes(user.role)) {
          throw new Error("SADECE_YONETICI_KARTI");
        }

        // SISTEM_ADMIN tüm sistemlere girebilir — sistem kontrolü atlanır
        const isSuperAdmin = user.role === "SISTEM_ADMIN";
        if (!isSuperAdmin && sistemEnum && user.sistem !== sistemEnum) {
          throw new Error("SISTEM_UYUMSUZ");
        }

        // SISTEM_ADMIN: seçilen kartın sistemi session'a yazılır → her kart farklı veri gösterir
        const sessionSistem = isSuperAdmin && sistemEnum ? sistemEnum : user.sistem;

        const a = user.assignments[0];
        return {
          id:            user.id,
          email:         user.email,
          ad:            user.ad,
          soyad:         user.soyad,
          role:          user.role,
          sistem:        sessionSistem,
          icerikYoneticisi: user.icerikYoneticisi,
          merkezGorev:   user.merkezGorev,
          teknikYetkisi: user.teknikYetkisi,
          anaRol:        user.anaRol?.kod ?? null,
          yanRoller:     user.yanRoller.map(r => r.yanRol.kod),
          activeIlId:    a?.ilId      ?? null,
          activeBolgeId: a?.bolgeId   ?? null,
          activeIlAd:    a?.il?.ad    ?? null,
          activeBolgeAd: a?.bolge?.ad ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email!;
        const existing = await loadDbUser(email);

        if (!existing) {
          const nameParts = (user.name ?? "").split(" ");
          const ad    = nameParts[0]                ?? "Ad";
          const soyad = nameParts.slice(1).join(" ") || "Soyad";

          await prisma.user.create({
            data: {
              ad,
              soyad,
              email:        email.toLowerCase(),
              role:         "BEKLEYEN",
              status:       "BEKLEMEDE",
              sistem:       "EGITIMCI",
              passwordHash: null,
            },
          });
        }
        return true;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (account?.provider === "credentials" && user) {
        token.id            = user.id;
        token.role          = user.role;
        token.sistem        = user.sistem;
        token.icerikYoneticisi = user.icerikYoneticisi;
        token.merkezGorev   = user.merkezGorev;
        token.teknikYetkisi = user.teknikYetkisi;
        token.anaRol        = user.anaRol;
        token.yanRoller     = user.yanRoller;
        token.ad            = user.ad;
        token.soyad         = user.soyad;
        token.activeIlId    = user.activeIlId;
        token.activeBolgeId = user.activeBolgeId;
        token.activeIlAd    = user.activeIlAd;
        token.activeBolgeAd = user.activeBolgeAd;
        return token;
      }

      if (account?.provider === "google" && user?.email) {
        const dbUser = await loadDbUser(user.email);
        if (dbUser) {
          const a = dbUser.assignments[0];
          token.id            = dbUser.id;
          token.role          = dbUser.role;
          token.sistem        = dbUser.sistem;
          token.icerikYoneticisi = dbUser.icerikYoneticisi;
          token.merkezGorev   = dbUser.merkezGorev;
          token.teknikYetkisi = dbUser.teknikYetkisi;
          token.anaRol        = dbUser.anaRol?.kod ?? null;
          token.yanRoller     = dbUser.yanRoller.map(r => r.yanRol.kod);
          token.ad            = dbUser.ad;
          token.soyad         = dbUser.soyad;
          token.activeIlId    = a?.ilId      ?? null;
          token.activeBolgeId = a?.bolgeId   ?? null;
          token.activeIlAd    = a?.il?.ad    ?? null;
          token.activeBolgeAd = a?.bolge?.ad ?? null;
        }
        return token;
      }

      // İçerik Yöneticisi yetkisi anlık yansısın: Merkez Ekip için her istekte
      // DB'den tazele (atama/kaldırma sonraki girişi beklemeden etkili olur).
      // Merkez-tier rollerde ana rol + yan roller (içerik/teknik) anlık yansısın:
      // her istekte DB'den role/sistem/görev/yan-rol tazelenir.
      const MERKEZ_TIER = ["GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "TEKNIK"];
      if (token?.id && MERKEZ_TIER.includes(token.role as string)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true, sistem: true, merkezGorev: true, icerikYoneticisi: true, teknikYetkisi: true,
            anaRol: { select: { kod: true } },
            yanRoller: { select: { yanRol: { select: { kod: true } } } },
          },
        });
        if (fresh) {
          token.role = fresh.role;
          token.sistem = fresh.sistem;
          token.merkezGorev = fresh.merkezGorev;
          token.icerikYoneticisi = fresh.icerikYoneticisi;
          token.teknikYetkisi = fresh.teknikYetkisi;
          token.anaRol = fresh.anaRol?.kod ?? null;
          token.yanRoller = fresh.yanRoller.map(r => r.yanRol.kod);
        }
      }

      // Saha rolleri (İl/Bölge sorumlusu): aktif atama + rol/sistem her istekte DB'den
      // tazelenir — görev/il değişikliği ya da yetki kaldırma ANINDA etkili olur. Aksi
      // halde activeIlId girişte donar ve eski ile yazma çıkışa kadar (30 güne dek) sürebilir.
      const SAHA_TIER = ["IL_SORUMLUSU", "BOLGE_SORUMLUSU"];
      if (token?.id && SAHA_TIER.includes(token.role as string)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            sistem: true,
            assignments: {
              where: { status: "AKTIF" },
              orderBy: { startedAt: "desc" },
              take: 1,
              include: { il: true, bolge: true },
            },
          },
        });
        if (fresh) {
          token.role = fresh.role;
          token.sistem = fresh.sistem;
          const a = fresh.assignments[0];
          token.activeIlId = a?.ilId ?? null;
          token.activeBolgeId = a?.bolgeId ?? null;
          token.activeIlAd = a?.il?.ad ?? null;
          token.activeBolgeAd = a?.bolge?.ad ?? null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id            = token.id;
      session.user.role          = token.role;
      session.user.sistem        = token.sistem;
      session.user.icerikYoneticisi = token.icerikYoneticisi ?? false;
      session.user.merkezGorev   = token.merkezGorev ?? null;
      session.user.teknikYetkisi = token.teknikYetkisi ?? false;
      session.user.anaRol        = token.anaRol ?? null;
      session.user.yanRoller     = token.yanRoller ?? [];
      session.user.ad            = token.ad;
      session.user.soyad         = token.soyad;
      session.user.activeIlId    = token.activeIlId;
      session.user.activeBolgeId = token.activeBolgeId;
      session.user.activeIlAd    = token.activeIlAd;
      session.user.activeBolgeAd = token.activeBolgeAd;
      return session;
    },
  },

  pages: { signIn: "/giris" },

  session: {
    strategy:  "jwt",
    maxAge:    30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path:     "/",
        secure:   process.env.NODE_ENV === "production",
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
