"use server";

import { z } from "zod";
import { requireUser } from "@/lib/require-role";
import { passwordChangeSchema } from "@/lib/user-schema";
import { changeOwnPassword } from "@/lib/users";

export type PasswordState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse({ current: text(formData, "current"), next: text(formData, "next"), confirm: text(formData, "confirm") });
  if (!parsed.success) return { message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(parsed.error).fieldErrors };

  const result = await changeOwnPassword(user.id, parsed.data.current, parsed.data.next);
  if (result.error) return { message: result.error, errors: { current: [result.error] } };
  return { ok: true, message: "Password diganti." };
}
