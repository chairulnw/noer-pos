import { ExamNew } from "../../pemeriksaan/exam-views";

export default function RadiologyNewPage({ searchParams }: { searchParams: Promise<{ patient?: string; q?: string }> }) {
  return <ExamNew type="RADIOLOGI" searchParams={searchParams} />;
}
