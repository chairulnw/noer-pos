import { ExamNew } from "../../pemeriksaan/exam-views";

export default function LabNewPage({ searchParams }: { searchParams: Promise<{ patient?: string; q?: string }> }) {
  return <ExamNew type="LAB" searchParams={searchParams} />;
}
