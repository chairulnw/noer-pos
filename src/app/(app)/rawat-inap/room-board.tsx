import { markCleanAction } from "./actions";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

type Room = {
  id: string;
  name: string;
  needsCleaning: boolean;
  capacity: number;
  suitableFor: string | null;
  defaultRate: { name: string; sellPrice: number } | null;
  admissions: { id: string; patient: { name: string; species: string } }[];
};

const STATE = {
  free: { label: "Tersedia", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  busy: { label: "Penuh", cls: "border-primary/30 bg-accent text-primary" },
  dirty: { label: "Perlu dibersihkan", cls: "border-amber-200 bg-amber-50 text-amber-800" },
} as const;

export function RoomBoard({ rooms }: { rooms: Room[] }) {
  if (rooms.length === 0) return null;
  const stateOf = (r: Room) => (r.needsCleaning ? "dirty" : r.admissions.length >= r.capacity ? "busy" : "free");
  const count = (s: keyof typeof STATE) => rooms.filter((r) => stateOf(r) === s).length;

  return (
    <section className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Total {rooms.length} kandang · {count("free")} tersedia · {count("busy")} terisi · {count("dirty")} perlu dibersihkan
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rooms.map((r) => {
          const state = stateOf(r);
          return (
            <div key={r.id} className={cn("space-y-1 rounded-[10px] border p-3.5", STATE[state].cls)}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{r.name}</span>
                <span className="text-[12px] font-medium">{STATE[state].label}{r.capacity > 1 && state !== "dirty" ? ` ${r.admissions.length}/${r.capacity}` : ""}</span>
              </div>
              {r.admissions.map((a) => <div key={a.id} className="text-[13.5px]">{a.patient.name} · {a.patient.species}</div>)}
              <div className="text-[12.5px] opacity-80">{[r.suitableFor, r.defaultRate && `${formatRupiah(r.defaultRate.sellPrice)}/hari`].filter(Boolean).join(" · ") || " "}</div>
              {state === "dirty" && (
                <form action={markCleanAction.bind(null, r.id)} className="pt-1">
                  <Button type="submit" size="sm" variant="outline">Tandai bersih</Button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
