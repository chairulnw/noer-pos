import { ExamList } from "../pemeriksaan/exam-views";

export default function RadiologyPage({ searchParams }: { searchParams: Promise<{ q?: string; dari?: string; sampai?: string; hal?: string; baris?: string }> }) {
  return <ExamList type="RADIOLOGI" searchParams={searchParams} />;
}
