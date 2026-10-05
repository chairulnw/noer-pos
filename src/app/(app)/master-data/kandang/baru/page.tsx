import { requireCapability } from "@/lib/require-role";
import { RoomForm } from "../room-form";

export default async function NewRoomPage() {
  await requireCapability("manage_rooms");
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Kandang Baru</h1>
      <RoomForm room={null} />
    </div>
  );
}
