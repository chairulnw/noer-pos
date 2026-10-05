import { ExamDetail } from "../../pemeriksaan/exam-views";

export default async function RadiologyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ExamDetail type="RADIOLOGI" id={(await params).id} />;
}
