"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type Toast = { id: number; message: string };

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("app-toast", { detail: message }));
}

export function Toaster({ flash }: { flash: string | null }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const show = (message: string) => {
      const id = Date.now() + Math.random();
      setToasts((cur) => [...cur, { id, message }]);
      setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 4000);
    };
    const onToast = (e: Event) => show((e as CustomEvent<string>).detail);
    window.addEventListener("app-toast", onToast);
    return () => window.removeEventListener("app-toast", onToast);
  }, []);

  useEffect(() => {
    if (!flash) return;
    document.cookie = "flash=; path=/; max-age=0";
    toast(decodeURIComponent(flash.split("|")[1] ?? ""));
  }, [flash]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-2.5 rounded-lg border bg-card px-4 py-3 text-sm font-medium shadow-lg">
          <CheckCircle2 className="size-[18px] text-success" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
