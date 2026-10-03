import { CircleAlert, TriangleAlert } from "lucide-react";

type Flags = { allergyNote: string | null; aggressive: boolean; behaviorNote?: string | null };

const tag = "inline-flex h-[22px] items-center rounded-[5px] border bg-card px-1.5 text-xs font-medium";

export function ClinicalTags({ allergyNote, aggressive }: Flags) {
  return (
    <>
      {allergyNote && <span className={`${tag} border-[#F0C4BF] text-destructive`}>Alergi</span>}
      {aggressive && <span className={`${tag} border-[#E9CFA6] text-warning`}>Agresif</span>}
    </>
  );
}

export function ClinicalNotes({ allergyNote, aggressive, behaviorNote }: Flags) {
  const behavior = behaviorNote || (aggressive ? "Agresif" : null);
  if (!allergyNote && !behavior) return null;

  return (
    <div className="flex flex-col gap-1.5 border-t bg-[#FCFCFD] px-5 py-3 text-sm">
      {allergyNote && (
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="inline-flex min-w-20 items-center gap-1.5 font-medium text-destructive">
            <TriangleAlert className="size-3.5" />
            Alergi
          </span>
          <span>{allergyNote}</span>
        </div>
      )}
      {behavior && (
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="inline-flex min-w-20 items-center gap-1.5 font-medium text-warning">
            <CircleAlert className="size-3.5" />
            Perilaku
          </span>
          <span>{behavior}</span>
        </div>
      )}
    </div>
  );
}
