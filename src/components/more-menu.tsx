"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { useMounted } from "@/components/modal";
import { cn } from "@/lib/utils";

export const menuItemClass = "flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm font-medium hover:bg-muted";

export function MoreMenu({ children, label = "Lainnya", iconOnly }: { children: React.ReactNode; label?: string; iconOnly?: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const mounted = useMounted();

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = trigger.current!.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={Boolean(pos)}
        aria-label={iconOnly ? label : undefined}
        onClick={toggle}
        className={cn("inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border bg-background text-sm font-medium hover:bg-muted", iconOnly ? "w-11" : "px-3.5")}
      >
        <MoreHorizontal className="size-4" />
        {!iconOnly && label}
      </button>
      {mounted &&
        createPortal(
          <>
            {pos && <div className="fixed inset-0 z-40" onClick={() => setPos(null)} />}
            <div
              role="menu"
              hidden={!pos}
              onClick={(e) => (e.target as HTMLElement).closest("a,button") && setPos(null)}
              style={pos ? { top: pos.top, right: pos.right } : undefined}
              className="fixed z-50 min-w-44 rounded-lg border bg-card p-1 shadow-lg"
            >
              {children}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
