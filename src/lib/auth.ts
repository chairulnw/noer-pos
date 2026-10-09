import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

// Hitungan gagal login disimpan di DB agar berlaku lintas instance (serverless)
const MAX_FAILURES = 10;
const WINDOW_MINUTES = 15;

const blocked = async (key: string) => {
  const entry = await prisma.loginThrottle.findUnique({ where: { key } });
  return Boolean(entry && entry.resetAt > new Date() && entry.count >= MAX_FAILURES);
};

const recordFailure = (key: string) =>
  prisma.$executeRaw`
    INSERT INTO login_throttle ("key", "count", reset_at)
    VALUES (${key}, 1, now() + make_interval(mins => ${WINDOW_MINUTES}))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN login_throttle.reset_at < now() THEN 1 ELSE login_throttle."count" + 1 END,
      reset_at = CASE WHEN login_throttle.reset_at < now() THEN now() + make_interval(mins => ${WINDOW_MINUTES}) ELSE login_throttle.reset_at END`;

const clearFailures = (key: string) => prisma.loginThrottle.deleteMany({ where: { key } });

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
        const device = `ip:${clientIp(request) ?? "unknown"}`;
        if (await blocked(device)) throw new LoginError("rate");

        const user = await prisma.user.findUnique({ where: { username } });
        const valid = user?.active ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!user || !valid) {
          await recordFailure(device);
          return null;
        }

        await clearFailures(device);

        const session = await prisma.userSession.create({
          data: { userId: user.id, userAgent: request?.headers.get("user-agent")?.slice(0, 300) ?? null, ip: clientIp(request) },
          select: { id: true },
        });
        return { id: user.id, name: user.name, role: user.role, sid: session.id };
      },
    }),
  ],
});
