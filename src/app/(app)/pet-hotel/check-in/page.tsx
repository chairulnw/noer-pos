import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { dateToJakartaLocal } from "@/lib/admission-calc";
import { searchPatients } from "@/lib/patients";
import { requireCapability } from "@/lib/require-role";
import { getHotelOverview } from "@/lib/rooms";
import { HotelCheckInForm, type SlotOption } from "./hotel-check-in-form";

export default async function PetHotelCheckInPage() {
  await requireCapability("manage_admission");
  const [{ rooms }, { patients }] = await Promise.all([getHotelOverview(), searchPatients("")]);
  const slots: SlotOption[] = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.suitableFor,
    rate: r.defaultRate?.sellPrice ?? null,
    state: r.needsCleaning ? "dirty" : r.admissions.length >= r.capacity ? "busy" : "free",
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/pet-hotel" aria-label="Kembali" className="grid size-10 place-items-center rounded-lg border bg-card"><ArrowLeft className="size-4" /></Link>
        <h1 className="text-[22px] leading-tight font-semibold">Form Check-In Pet Hotel</h1>
      </div>
      <HotelCheckInForm slots={slots} patients={patients.map((p) => ({ id: p.id, name: p.name, detail: `${p.species} · ${p.owner.name}` }))} today={dateToJakartaLocal(new Date()).slice(0, 10)} />
    </div>
  );
}
