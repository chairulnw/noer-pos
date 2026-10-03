import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response(null, { status: 401 });
  if (!can(session.user.role, "manage_invoice_payment")) return new Response(null, { status: 403 });

  const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec((await getSettings()).qris);
  if (!match) return new Response(null, { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), { headers: { "Content-Type": match[1], "Cache-Control": "private, max-age=60" } });
}
