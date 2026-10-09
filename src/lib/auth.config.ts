import type { NextAuthConfig } from "next-auth";

// Edge-safe (tanpa Prisma/provider), dipakai proxy.ts
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isDoctor = user.isDoctor;
        token.sid = user.sid;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "ADMIN" | "KARYAWAN";
      session.user.isDoctor = Boolean(token.isDoctor);
      session.sid = token.sid as string | undefined;
      return session;
    },
  },
};
