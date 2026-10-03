import { startTransition } from "react";

export const keepValuesOnError =
  (formAction: (formData: FormData) => void) => (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { submitter } = event.nativeEvent as SubmitEvent;
    startTransition(() => formAction(new FormData(event.currentTarget, submitter)));
  };
