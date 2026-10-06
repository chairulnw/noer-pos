"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function RowLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr
      onClick={(e) => !(e.target as HTMLElement).closest("a,button") && router.push(href)}
      className={cn("cursor-pointer hover:bg-accent/40", className)}
    >
      {children}
    </tr>
  );
}
