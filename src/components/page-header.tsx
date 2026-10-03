import Link from "next/link";

type Props = {
  back: { href: string; label: string };
  title: React.ReactNode;
  status?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({ back, title, status, meta, actions, children }: Props) {
  return (
    <header className="overflow-hidden rounded-[10px] border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 px-5">
        <div className="min-w-0 space-y-1">
          <Link href={back.href} className="text-[13px] font-medium text-primary">← {back.label}</Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-semibold leading-11">{title}</h1>
            {status}
          </div>
          {meta && <div className="space-y-1 text-sm text-muted-foreground">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 pt-5">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

export function EmptyState({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center text-sm text-muted-foreground">
      <p>{children}</p>
      {action}
    </div>
  );
}
