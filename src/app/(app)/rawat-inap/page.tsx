import { AdmissionsList } from "./admissions-list";

export default function AdmissionsPage({ searchParams }: { searchParams: Promise<{ hal?: string; baris?: string }> }) {
  return <AdmissionsList type="RAWAT_INAP" searchParams={searchParams} />;
}
