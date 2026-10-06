import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-[10px] border bg-card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function Field({
  label,
  name,
  errors,
  full,
  hint,
  children,
}: {
  label: string;
  name: string;
  errors?: string[];
  full?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", full && "md:col-span-2")}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {hint && <p className="text-[12.5px] text-muted-foreground">{hint}</p>}
      {errors?.map((error) => (
        <p key={error} className="text-[12.5px] text-destructive">
          {error}
        </p>
      ))}
    </div>
  );
}

export function CheckField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex min-h-11 items-center gap-2 md:col-span-2">
      <input id={name} name={name} type="checkbox" defaultChecked={defaultChecked} className="size-5 accent-primary" />
      <Label htmlFor={name}>{label}</Label>
    </div>
  );
}
