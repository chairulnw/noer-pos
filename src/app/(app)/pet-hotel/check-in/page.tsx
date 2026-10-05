import { CheckInView } from "../../rawat-inap/check-in/check-in-view";

export default function PetHotelCheckInPage({ searchParams }: { searchParams: Promise<{ patient?: string; q?: string }> }) {
  return <CheckInView searchParams={searchParams} type="HOTEL" />;
}
