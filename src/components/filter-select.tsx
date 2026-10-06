"use client";

import { cn } from "@/lib/utils";

export function FilterSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} className={cn("h-11 rounded-lg border border-input bg-card px-3 text-sm", className)} />;
}
