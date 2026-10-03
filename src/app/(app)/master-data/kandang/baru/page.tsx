import { requireCapability } from "@/lib/require-role";
import { RoomForm } from "../room-form";

export default async function NewRoomPage() {
  await requireCapability("manage_rooms");
  return <RoomForm room={null} />;
}
