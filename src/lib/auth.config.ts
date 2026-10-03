import type { NextAuthConfig } from "next-auth";

// Edge-safe (tanpa Prisma/provider), dipakai proxy.ts
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "ADMIN" | "DOKTER" | "KASIR";
      return session;
    },
  },
};
