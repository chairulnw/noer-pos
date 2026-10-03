"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckField, Field, Section, selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { createUserAction, resetPasswordAction, updateUserAction, type UserFormState } from "./actions";

type User = { id: string; username: string; name: string; role: "ADMIN" | "DOKTER" | "KASIR"; active: boolean };

const RoleSelect = ({ defaultValue }: { defaultValue?: string }) => (
  <select id="role" name="role" defaultValue={defaultValue ?? "KASIR"} className={selectClass}>
    <option value="ADMIN">Owner / Admin</option>
    <option value="DOKTER">Dokter</option>
    <option value="KASIR">Kasir</option>
  </select>
);

function Footer({ pending, state, cancel }: { pending: boolean; state: UserFormState; cancel?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
      {cancel && <Button variant="outline" asChild><Link href="/pengguna">Batal</Link></Button>}
      {state.message && <p role="status" className={state.ok ? "text-sm text-success" : "text-sm text-destructive"}>{state.message}</p>}
    </div>
  );
}

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(createUserAction, {});
  const err = (key: string) => state.errors?.[key];
  return (
    <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
      <Section title="Pengguna baru">
        <Field label="Nama" name="name" errors={err("name")}><Input id="name" name="name" required /></Field>
        <Field label="Username" name="username" errors={err("username")} hint="Dipakai untuk login. Huruf kecil, tanpa spasi.">
          <Input id="username" name="username" autoCapitalize="none" required />
        </Field>
        <Field label="Role" name="role" errors={err("role")}><RoleSelect /></Field>
        <Field label="Password awal" name="password" errors={err("password")} hint="Minimal 8 karakter. Pengguna bisa menggantinya sendiri.">
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </Field>
      </Section>
      <Footer pending={pending} state={state} cancel />
    </form>
  );
}

export function EditUserForm({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(updateUserAction.bind(null, user.id), {});
  const [resetState, resetAction, resetPending] = useActionState<UserFormState, FormData>(resetPasswordAction.bind(null, user.id), {});
  const err = (key: string) => state.errors?.[key];
  return (
    <div className="space-y-5">
      <form onSubmit={keepValuesOnError(formAction)} className="space-y-5">
        <Section title={`@${user.username}`}>
          <Field label="Nama" name="name" errors={err("name")}><Input id="name" name="name" defaultValue={user.name} required /></Field>
          <Field label="Role" name="role" errors={err("role")} hint={isSelf ? "Role akun sendiri tidak bisa diubah." : undefined}>
            <RoleSelect defaultValue={user.role} />
          </Field>
          <CheckField name="active" label={isSelf ? "Aktif (akun sendiri tidak bisa dinonaktifkan)" : "Aktif (bisa login)"} defaultChecked={user.active} />
        </Section>
        <Footer pending={pending} state={state} cancel />
      </form>

      <form onSubmit={keepValuesOnError(resetAction)} className="space-y-5">
        <Section title="Reset password">
          <Field label="Password baru" name="reset-password" errors={resetState.errors?.password}>
            <Input id="reset-password" name="password" type="password" autoComplete="new-password" required />
          </Field>
        </Section>
        <Footer pending={resetPending} state={resetState} />
      </form>
    </div>
  );
}
