import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Case-insensitive email lookup
        const user = await prisma.user.findFirst({
          where: { email: { equals: credentials.email.trim(), mode: "insensitive" } },
          include: {
            assignments: {
              where: { status: "AKTIF" },
              orderBy: { startedAt: "desc" },
              take: 1,
              include: { il: true, bolge: true },
            },
          },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        const activeAssignment = user.assignments[0];

        return {
          id: user.id,
          email: user.email,
          ad: user.ad,
          soyad: user.soyad,
          role: user.role,
          activeIlId: activeAssignment?.ilId ?? null,
          activeBolgeId: activeAssignment?.bolgeId ?? null,
          activeIlAd: activeAssignment?.il?.ad ?? null,
          activeBolgeAd: activeAssignment?.bolge?.ad ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.ad = user.ad;
        token.soyad = user.soyad;
        token.activeIlId = user.activeIlId;
        token.activeBolgeId = user.activeBolgeId;
        token.activeIlAd = user.activeIlAd;
        token.activeBolgeAd = user.activeBolgeAd;
      }
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
  pages: {
    signIn: "/giris",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 gün
    updateAge: 24 * 60 * 60,   // Her 24 saatte bir yenile
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
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
