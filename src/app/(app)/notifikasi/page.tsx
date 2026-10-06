import Link from "next/link";
import { Bell } from "lucide-react";
import { ListHeader } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { listNotices } from "@/lib/notifications";
import { requireUser } from "@/lib/require-role";
import { cn } from "@/lib/utils";
import { markAllReadAction } from "./actions";

const DOT = { danger: "bg-destructive", warning: "bg-warning", info: "bg-info" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notices = await listNotices(user.id, user.role);
  const unread = notices.filter((n) => n.unread).length;

  return (
    <div className="space-y-5">
      <ListHeader
        icon={Bell}
        title="Notifikasi"
        subtitle={unread > 0 ? `${unread} belum dibaca` : "Tidak ada pemberitahuan baru"}
        actions={unread > 0 && <form action={markAllReadAction}><Button type="submit" variant="outline">Tandai Dibaca</Button></form>}
      />
      <section className="overflow-hidden rounded-[10px] border bg-card">
        {notices.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">Tidak ada pemberitahuan. Stok dan jadwal vaksin yang perlu perhatian akan muncul di sini.</p>}
        {notices.map((n) => (
          <Link key={n.key} href={n.href} className={cn("flex items-start gap-3 border-b px-5 py-3.5 last:border-0 hover:bg-muted/50", n.unread && "bg-accent/40")}>
            <span className={cn("mt-2 size-2 shrink-0 rounded-full", DOT[n.tone])} />
            <span className="min-w-0 flex-1">
              <span className={cn("block text-[13.5px]", n.unread ? "font-semibold" : "font-medium")}>{n.title}</span>
              <span className="block text-[13px] text-muted-foreground">{n.detail}</span>
            </span>
            {n.unread && <span className="mt-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">Baru</span>}
          </Link>
        ))}
      </section>
    </div>
  );
}
