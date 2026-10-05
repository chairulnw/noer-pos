import { CheckInView } from "./check-in-view";

export default function CheckInPage({ searchParams }: { searchParams: Promise<{ patient?: string; q?: string }> }) {
  return <CheckInView searchParams={searchParams} type="RAWAT_INAP" />;
}
