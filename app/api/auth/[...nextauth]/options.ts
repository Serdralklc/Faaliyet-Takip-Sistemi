import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      ad: string;
      soyad: string;
      role: Role;
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
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await loadDbUser(credentials.email);
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        const a = user.assignments[0];
        return {
          id: user.id,
          email: user.email,
          ad: user.ad,
          soyad: user.soyad,
          role: user.role,
          activeIlId: a?.ilId ?? null,
          activeBolgeId: a?.bolgeId ?? null,
          activeIlAd: a?.il?.ad ?? null,
          activeBolgeAd: a?.bolge?.ad ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Google ile giriş
      if (account?.provider === "google") {
        const email = user.email!;
        const existing = await loadDbUser(email);

        if (!existing) {
          // Yeni kullanıcı — Google'dan adı ayır
          const nameParts = (user.name ?? "").split(" ");
          const ad = nameParts[0] ?? "Ad";
          const soyad = nameParts.slice(1).join(" ") || "Soyad";

          await prisma.user.create({
            data: {
              ad,
              soyad,
              email: email.toLowerCase(),
              role: "BEKLEYEN",
              status: "BEKLEMEDE",
              passwordHash: null,
            },
          });
        }
        return true;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // Credentials ile ilk giriş — user objesi gelir
      if (account?.provider === "credentials" && user) {
        token.id = user.id;
        token.role = user.role;
        token.ad = user.ad;
        token.soyad = user.soyad;
        token.activeIlId = user.activeIlId;
        token.activeBolgeId = user.activeBolgeId;
        token.activeIlAd = user.activeIlAd;
        token.activeBolgeAd = user.activeBolgeAd;
        return token;
      }

      // Google ile ilk giriş — DB'den yükle
      if (account?.provider === "google" && user?.email) {
        const dbUser = await loadDbUser(user.email);
        if (dbUser) {
          const a = dbUser.assignments[0];
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.ad = dbUser.ad;
          token.soyad = dbUser.soyad;
          token.activeIlId = a?.ilId ?? null;
          token.activeBolgeId = a?.bolgeId ?? null;
          token.activeIlAd = a?.il?.ad ?? null;
          token.activeBolgeAd = a?.bolge?.ad ?? null;
        }
        return token;
      }

      // Sonraki isteklerde token zaten dolu — olduğu gibi dön
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.ad = token.ad;
      session.user.soyad = token.soyad;
      session.user.activeIlId = token.activeIlId;
      session.user.activeBolgeId = token.activeBolgeId;
      session.user.activeIlAd = token.activeIlAd;
      session.user.activeBolgeAd = token.activeBolgeAd;
      return session;
    },
  },

  pages: { signIn: "/giris" },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
