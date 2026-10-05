import { ExamEdit } from "../../../pemeriksaan/exam-views";

export default async function RadiologyEditPage({ params }: { params: Promise<{ id: string }> }) {
  return <ExamEdit type="RADIOLOGI" id={(await params).id} />;
}
