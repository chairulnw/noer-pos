import { z } from "zod";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getAttachmentFile } from "@/lib/records";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response(null, { status: 401 });
  if (!can(session.user.role, "view_medical_record")) return new Response(null, { status: 403 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response(null, { status: 404 });
  const file = await getAttachmentFile(id).catch(() => null);
  if (!file) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.row.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.row.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
