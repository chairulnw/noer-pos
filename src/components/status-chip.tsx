import { cn } from "@/lib/utils";

const DOT = { success: "bg-success", neutral: "bg-[#8A929B]", warning: "bg-warning", info: "bg-info", danger: "bg-destructive" };

export function StatusChip({ tone, children }: { tone: keyof typeof DOT; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full border bg-card px-2.5 text-[13px] text-[#3B434C]">
      <span className={cn("size-[7px] rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}
