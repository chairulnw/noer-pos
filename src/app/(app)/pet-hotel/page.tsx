import { AdmissionsList } from "../rawat-inap/admissions-list";

export default function PetHotelPage({ searchParams }: { searchParams: Promise<{ hal?: string; baris?: string }> }) {
  return <AdmissionsList type="HOTEL" searchParams={searchParams} />;
}
