"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Section } from "@/components/form-fields";
import { changePasswordAction, type PasswordState } from "./actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});
  const err = (key: string) => state.errors?.[key];
  return (
    <form key={state.ok ? "done" : "form"} action={formAction} className="max-w-4xl space-y-5">
      <Section title="Ganti password">
        <Field label="Password saat ini" name="current" errors={err("current")} full>
          <Input id="current" name="current" type="password" autoComplete="current-password" required />
        </Field>
        <Field label="Password baru" name="next" errors={err("next")} hint="Minimal 8 karakter.">
          <Input id="next" name="next" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Ulangi password baru" name="confirm" errors={err("confirm")}>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        </Field>
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Ganti password"}</Button>
        {state.message && <p role="status" className={state.ok ? "text-sm text-success" : "text-sm text-destructive"}>{state.message}</p>}
      </div>
    </form>
  );
}
