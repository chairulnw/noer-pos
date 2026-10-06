import { requireCapability } from "@/lib/require-role";
import { RoomForm } from "../room-form";

export default async function NewRoomPage({ searchParams }: { searchParams: Promise<{ jenis?: string }> }) {
  const { jenis } = await searchParams;
  await requireCapability("manage_rooms");
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Kandang Baru</h1>
      <RoomForm room={null} defaultType={jenis === "HOTEL" ? "HOTEL" : "RAWAT_INAP"} />
    </div>
  );
}
