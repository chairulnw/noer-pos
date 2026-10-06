"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <span className="relative inline-flex">
      <select
        {...props}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={cn("h-11 min-w-44 appearance-none rounded-lg border border-input bg-card pr-10 pl-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", className)}
      />
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </span>
  );
}
