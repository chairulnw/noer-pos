import { startTransition } from "react";

export const keepValuesOnError =
  (formAction: (formData: FormData) => void) => (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => formAction(new FormData(event.currentTarget)));
  };
