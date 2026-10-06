import Link from "next/link";
import { DoorOpen } from "lucide-react";
import { ListHeader, ListPage, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { parsePaging, type PagingParams } from "@/lib/paging";
import { listRooms } from "@/lib/rooms";
import { requireCapability } from "@/lib/require-role";

export default async function RoomsPage({ searchParams }: { searchParams: Promise<PagingParams> }) {
  await requireCapability("manage_rooms");
  const params = await searchParams;
  const { page, size, skip, take } = parsePaging(params);
  const all = await listRooms();
  const rooms = all.slice(skip, skip + take);
  const add = <Button asChild><Link href="/master-data/kandang/baru">+ Kandang Baru</Link></Button>;

  return (
    <ListPage>
      <ListHeader icon={DoorOpen} title="Master Kandang" subtitle="Daftar kandang rawat inap dan pet hotel" actions={<><Button asChild variant="outline"><Link href="/pet-hotel">Kembali ke Pet Hotel</Link></Button>{add}</>} />
      <TableCard
        columns={[{ label: "Nama" }, { label: "Jenis" }, { label: "Kapasitas", align: "right" }, { label: "Tarif / hari", align: "right" }, { label: "Peruntukan" }, { label: "Status" }, { label: "Aksi", align: "right" }]}
        total={all.length}
        page={page}
        size={size}
        base="/master-data/kandang"
        params={{ baris: params.baris }}
        minWidth={760}
        empty={<EmptyState action={add}>Belum ada kandang.</EmptyState>}
      >
        {rooms.map((room) => (
          <tr key={room.id} className="border-b last:border-0">
            <td className="px-4 py-3 font-medium">{room.name}</td>
            <td className="px-4 py-3">{room.type === "RAWAT_INAP" ? "Rawat inap" : "Hotel"}</td>
            <td className="px-4 py-3 text-right tabular-nums">{room.capacity}</td>
            <td className="px-4 py-3 text-right tabular-nums">{room.defaultRate ? formatRupiah(room.defaultRate.sellPrice) : "—"}</td>
            <td className="px-4 py-3">{room.suitableFor ?? "—"}</td>
            <td className="px-4 py-3"><StatusChip tone={room.active ? "success" : "neutral"}>{room.active ? "Aktif" : "Nonaktif"}</StatusChip></td>
            <td className="px-4 py-3 text-right"><Link href={`/master-data/kandang/${room.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Ubah</Link></td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}
