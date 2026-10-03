"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export const useMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export function Modal({ dialogRef, children }: { dialogRef: React.RefObject<HTMLDialogElement | null>; children: React.ReactNode }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(
    <dialog ref={dialogRef} className="m-auto w-[min(92vw,460px)] rounded-[10px] border bg-card p-5 text-card-foreground shadow-xl backdrop:bg-black/40">
      {children}
    </dialog>,
    document.body,
  );
}
