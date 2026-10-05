import { ExamDetail } from "../../pemeriksaan/exam-views";

export default async function LabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ExamDetail type="LAB" id={(await params).id} />;
}
