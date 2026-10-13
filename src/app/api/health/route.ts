import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Untuk pemantau uptime (tanpa login): 200 bila aplikasi dan database siap, 503 bila database tidak bisa dihubungi.
// Sengaja tidak menyertakan detail error agar tidak membocorkan informasi server.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
