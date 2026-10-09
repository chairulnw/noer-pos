import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

// ponytail: hitungan gagal login in-memory per proses, Redis jika multi-instance
const failures = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;

const blocked = (key: string) => {
  const entry = failures.get(key);
  return Boolean(entry && entry.resetAt > Date.now() && entry.count >= MAX_FAILURES);
};

function recordFailure(key: string) {
  const entry = failures.get(key);
  if (!entry || entry.resetAt < Date.now()) failures.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
  else entry.count += 1;
}

export class LoginError extends CredentialsSignin {
  constructor(code: "rate") {
    super();
    this.code = code;
  }
}

const SEEN_EVERY_MS = 5 * 60 * 1000;
// cf-connecting-ip hanya dipercaya bila server memang di belakang Cloudflare (bisa dipalsukan bila tidak)
const clientIp = (request?: Request) => (process.env.TRUST_CLOUDFLARE === "1" && request?.headers.get("cf-connecting-ip")) || request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || request?.headers.get("x-real-ip") || null;

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
      const session = sid ? await prisma.userSession.findUnique({ where: { id: sid }, select: { revokedAt: true, lastSeenAt: true, user: { select: { id: true, active: true, role: true, isDoctor: true } } } }) : null;
      if (!session || session.revokedAt || session.user.id !== token.id || !session.user.active) return null;
      if (Date.now() - session.lastSeenAt.getTime() > SEEN_EVERY_MS) await prisma.userSession.update({ where: { id: sid }, data: { lastSeenAt: new Date() } });
      token.role = session.user.role;
      token.isDoctor = session.user.isDoctor;
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
        const device = `ip:${clientIp(request) ?? "unknown"}`;
        if (blocked(device)) throw new LoginError("rate");

        const user = await prisma.user.findUnique({ where: { username } });
        const valid = user?.active ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!user || !valid) {
          recordFailure(device);
          return null;
        }

        failures.delete(device);

        const session = await prisma.userSession.create({
          data: { userId: user.id, userAgent: request?.headers.get("user-agent")?.slice(0, 300) ?? null, ip: clientIp(request) },
          select: { id: true },
        });
        return { id: user.id, name: user.name, role: user.role, isDoctor: user.isDoctor, sid: session.id };
      },
    }),
  ],
});
