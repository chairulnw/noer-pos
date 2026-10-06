import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCw, Search } from "lucide-react";
import { buildHref, pageRange, PAGE_SIZES } from "@/lib/paging";
import { cn } from "@/lib/utils";

export function ListPage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4 md:h-[calc(100dvh-3.5rem)]">{children}</div>;
}

export function ListHeader({ icon: Icon, title, subtitle, actions }: { icon?: React.ComponentType<{ className?: string }>; title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><Icon className="size-5" /></div>}
        <div className="min-w-0">
          <h1 className="text-[20px] leading-tight font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

type ToolbarProps = {
  base: string;
  params: Record<string, string | undefined>;
  searchName?: string;
  placeholder?: string;
  total: number;
  children?: React.ReactNode;
  extra?: React.ReactNode;
};

export function ListToolbar({ base, params, searchName = "q", placeholder = "Cari…", total, children, extra }: ToolbarProps) {
  const hidden = Object.entries(params).filter(([key, value]) => value && key !== searchName && key !== "hal");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <form action={base} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {hidden.map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
        <div className="flex h-11 w-full max-w-md items-center gap-2.5 rounded-lg border border-input bg-card px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <Search className="size-[18px] text-muted-foreground" />
          <input name={searchName} data-search defaultValue={params[searchName] ?? ""} aria-label={placeholder} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
        </div>
        {children}
      </form>
      <div className="flex items-center gap-2">
        {extra}
        <span className="flex h-11 items-center rounded-lg border bg-card px-3 text-sm text-muted-foreground">Total: <b className="ml-1 text-foreground tabular-nums">{total.toLocaleString("id-ID")}</b>&nbsp;Data</span>
        <Link href={buildHref(base, params)} aria-label="Muat ulang" className="flex size-11 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-muted"><RotateCw className="size-4" /></Link>
      </div>
    </div>
  );
}

export function Chips({ items, active, hrefFor }: { items: { value: string; label: string }[]; active: string; hrefFor: (value: string) => string }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist">
      {items.map((item) => (
        <Link key={item.value} href={hrefFor(item.value)} role="tab" aria-selected={active === item.value} className={cn("flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium", active === item.value ? "border-primary bg-accent text-primary" : "bg-card text-muted-foreground hover:bg-muted")}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export type Column = { label: string; align?: "right" | "center"; className?: string };

export function TableCard({ columns, children, empty, total, page, size, base, params, minWidth = 640 }: {
  columns: Column[];
  children: React.ReactNode;
  empty?: React.ReactNode;
  total: number;
  page: number;
  size: number;
  base: string;
  params: Record<string, string | undefined>;
  minWidth?: number;
}) {
  const { from, to, pages } = pageRange(total, page, size);
  const href = (patch: Record<string, string | undefined>) => buildHref(base, params, patch);
  const nav = "flex size-9 items-center justify-center rounded-lg border";

  return (
    <section className="flex min-h-96 flex-1 flex-col overflow-hidden rounded-[10px] border bg-card md:min-h-0">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-[13.5px]" style={{ minWidth }}>
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b text-left text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">
              {columns.map((c) => <th key={c.label} className={cn("px-4 py-3", c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>{total === 0 && empty ? null : children}</tbody>
        </table>
        {total === 0 && empty && <div className="flex min-h-64 items-center justify-center">{empty}</div>}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-sm text-muted-foreground">
        <span>Menampilkan <b className="text-foreground tabular-nums">{from}</b> - <b className="text-foreground tabular-nums">{to}</b> dari <b className="text-foreground tabular-nums">{total}</b> data</span>
        <div className="flex items-center gap-2">
          <span>Baris:</span>
          {PAGE_SIZES.map((n) => (
            <Link key={n} href={href({ baris: n === PAGE_SIZES[0] ? undefined : String(n), hal: undefined })} aria-current={n === size ? "true" : undefined} className={cn("flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 font-medium", n === size ? "border-primary bg-accent text-primary" : "hover:bg-muted")}>{n}</Link>
          ))}
          {page > 1 ? <Link href={href({ hal: page - 1 > 1 ? String(page - 1) : undefined })} aria-label="Halaman sebelumnya" className={cn(nav, "hover:bg-muted")}><ChevronLeft className="size-4" /></Link> : <span className={cn(nav, "opacity-40")}><ChevronLeft className="size-4" /></span>}
          {page < pages ? <Link href={href({ hal: String(page + 1) })} aria-label="Halaman berikutnya" className={cn(nav, "hover:bg-muted")}><ChevronRight className="size-4" /></Link> : <span className={cn(nav, "opacity-40")}><ChevronRight className="size-4" /></span>}
        </div>
      </footer>
    </section>
  );
}
