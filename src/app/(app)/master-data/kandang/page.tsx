import Link from "next/link";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/status-chip";
import { listRooms } from "@/lib/rooms";
import { requireCapability } from "@/lib/require-role";

export default async function RoomsPage() {
  await requireCapability("manage_rooms");
  const rooms = await listRooms();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/master-data/kandang/baru">+ Kandang baru</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[480px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Nama</th>
              <th className="px-4 py-2.5 font-normal">Jenis</th>
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState action={<Button asChild><Link href="/master-data/kandang/baru">+ Kandang baru</Link></Button>}>Belum ada kandang.</EmptyState>
                </td>
              </tr>
            )}
            {rooms.map((room) => (
              <tr key={room.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{room.name}</td>
                <td className="px-4 py-3">{room.type === "RAWAT_INAP" ? "Rawat inap" : "Hotel"}</td>
                <td className="px-4 py-3">
                  <StatusChip tone={room.active ? "success" : "neutral"}>{room.active ? "Aktif" : "Nonaktif"}</StatusChip>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/master-data/kandang/${room.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">
                    Ubah
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
