"use client";

import { Button } from "@/components/ui/button";

export function ConfirmButton({ message, ...props }: React.ComponentProps<typeof Button> & { message: string }) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!confirm(message)) event.preventDefault();
      }}
    />
  );
}
