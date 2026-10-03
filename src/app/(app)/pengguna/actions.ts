"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCapability } from "@/lib/require-role";
import { passwordResetSchema, userCreateSchema, userUpdateSchema } from "@/lib/user-schema";
import { createUser, resetPassword, updateUser } from "@/lib/users";
import { flash } from "@/components/flash";

export type UserFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const invalid = (error: z.ZodError): UserFormState => ({ message: "Periksa kembali isian yang ditandai.", errors: z.flattenError(error).fieldErrors });

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const admin = await requireCapability("manage_users_settings");
  const parsed = userCreateSchema.safeParse({ name: text(formData, "name"), username: text(formData, "username"), role: text(formData, "role"), password: text(formData, "password") });
  if (!parsed.success) return invalid(parsed.error);

  const result = await createUser(admin.id, parsed.data);
  if ("error" in result) return { message: result.error, errors: { username: [result.error] } };
  revalidatePath("/pengguna");
  await flash("Pengguna ditambahkan");
  redirect("/pengguna");
}

export async function updateUserAction(id: string, _prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const admin = await requireCapability("manage_users_settings");
  const parsed = userUpdateSchema.safeParse({ name: text(formData, "name"), role: text(formData, "role"), active: formData.get("active") === "on" });
  if (!parsed.success) return invalid(parsed.error);

  const result = await updateUser(admin.id, id, parsed.data);
  if (result.error) return { message: result.error };
  revalidatePath("/pengguna");
  await flash("Perubahan disimpan");
  return { ok: true, message: "Perubahan disimpan." };
}

export async function resetPasswordAction(id: string, _prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const admin = await requireCapability("manage_users_settings");
  const parsed = passwordResetSchema.safeParse({ password: text(formData, "password") });
  if (!parsed.success) return invalid(parsed.error);

  const result = await resetPassword(admin.id, id, parsed.data.password);
  if (result.error) return { message: result.error };
  await flash("Password diganti");
  return { ok: true, message: "Password diganti. Sampaikan password baru ke pengguna." };
}
