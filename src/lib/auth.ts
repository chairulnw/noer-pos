import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

// ponytail: rate limit in-memory per proses, Redis jika multi-instance
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(key: string) {
  const entry = loginAttempts.get(key);
  const now = Date.now();
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

const SEEN_EVERY_MS = 5 * 60 * 1000;
const clientIp = (request?: Request) => request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || request?.headers.get("x-real-ip") || null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    async signOut(message) {
      const sid = "token" in message ? (message.token?.sid as string | undefined) : undefined;
      if (sid) await prisma.userSession.updateMany({ where: { id: sid, revokedAt: null }, data: { revokedAt: new Date() } });
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    // sesi JWT dicek ke DB agar akun nonaktif / role berubah langsung berlaku
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sid = user.sid;
        return token;
      }
      const sid = token.sid as string | undefined;
      const session = sid ? await prisma.userSession.findUnique({ where: { id: sid }, select: { revokedAt: true, lastSeenAt: true, user: { select: { id: true, active: true, role: true } } } }) : null;
      if (!session || session.revokedAt || session.user.id !== token.id || !session.user.active) return null;
      if (Date.now() - session.lastSeenAt.getTime() > SEEN_EVERY_MS) await prisma.userSession.update({ where: { id: sid }, data: { lastSeenAt: new Date() } });
      token.role = session.user.role;
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      authorize: async (credentials, request) => {
        const rawUsername = credentials?.username;
        const password = credentials?.password;
        if (typeof rawUsername !== "string" || typeof password !== "string") return null;

        const username = rawUsername.trim().toLowerCase();

        if (isRateLimited(username)) {
          throw new Error("Terlalu banyak percobaan login. Coba lagi dalam 15 menit.");
        }

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        const session = await prisma.userSession.create({
          data: { userId: user.id, userAgent: request?.headers.get("user-agent")?.slice(0, 300) ?? null, ip: clientIp(request) },
          select: { id: true },
        });
        return { id: user.id, name: user.name, role: user.role, sid: session.id };
      },
    }),
  ],
});
