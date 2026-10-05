import { ExamEdit } from "../../../pemeriksaan/exam-views";

export default async function LabEditPage({ params }: { params: Promise<{ id: string }> }) {
  return <ExamEdit type="LAB" id={(await params).id} />;
}
