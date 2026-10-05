"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { keepValuesOnError } from "@/lib/form";
import { addExamFileAction, type ExamFormState } from "./actions";

export function ExamFileForm({ examId }: { examId: string }) {
  const [state, formAction, pending] = useActionState<ExamFormState, FormData>(addExamFileAction.bind(null, examId), {});
  return (
    <form key={state.nonce} onSubmit={keepValuesOnError(formAction)} className="flex flex-wrap items-center gap-3">
      <Input name="file" type="file" accept="application/pdf,image/jpeg,image/png" aria-label="File lampiran" className="max-w-xs" />
      <Button type="submit" variant="outline" disabled={pending}>Unggah</Button>
      {state.message && <p role="status" className={`text-sm ${state.ok ? "text-success" : "text-destructive"}`}>{state.message}</p>}
    </form>
  );
}
