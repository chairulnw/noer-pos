import { z } from "zod";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getPatientPhoto } from "@/lib/patients";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response(null, { status: 401 });
  if (!can(session.user.role, "manage_patients")) return new Response(null, { status: 403 });

  const { id } = await params;
  if (!z.guid().safeParse(id).success) return new Response(null, { status: 404 });
  const photo = await getPatientPhoto(id).catch(() => null);
  if (!photo) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(photo.data), {
    headers: { "Content-Type": photo.mime, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=300" },
  });
}
