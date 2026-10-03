import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  DEFAULT_SETTINGS,
  auditValue,
  diffSettings,
  settingsSchema,
  type Settings,
} from "@/lib/settings-schema";

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.settings.findMany();
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return settingsSchema.parse({ ...DEFAULT_SETTINGS, ...stored });
}

export async function getLogo() {
  const row = await prisma.settings.findUnique({ where: { key: "logo" } });
  return typeof row?.value === "string" && row.value ? row.value : "/logo-noer.png";
}

export async function saveSettings(userId: string, next: Settings) {
  const changes = diffSettings(await getSettings(), next);
  if (changes.length === 0) return changes;

  await prisma.$transaction(async (tx) => {
    for (const { key, before, after } of changes) {
      await tx.settings.upsert({
        where: { key },
        create: { key, value: after },
        update: { value: after },
      });
      await logAudit(tx, {
        userId,
        action: "settings.update",
        entity: "settings",
        entityId: key,
        before: auditValue(key, before) as Prisma.InputJsonValue,
        after: auditValue(key, after) as Prisma.InputJsonValue,
      });
    }
  });
  return changes;
}
