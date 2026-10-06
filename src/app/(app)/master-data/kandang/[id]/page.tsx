import { notFound } from "next/navigation";
import { z } from "zod";
import { getRoom, listDailyRates } from "@/lib/rooms";
import { requireCapability } from "@/lib/require-role";
import { RoomForm } from "../room-form";

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("manage_rooms");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();

  const [room, rates] = await Promise.all([getRoom(id), listDailyRates()]);
  if (!room) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Ubah kandang {room.name}</h1>
      <RoomForm room={room} rates={rates} />
    </div>
  );
}
