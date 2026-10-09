"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Nilai disimpan sebagai string angka dengan titik desimal ("53.328"); tampilan memakai format Indonesia ("53,328").
const group = (value: string) => {
  if (!value) return "";
  const [int, frac] = value.split(".");
  return (int ? Number(int).toLocaleString("id-ID") : "0") + (frac !== undefined ? `,${frac}` : "");
};

const sanitize = (raw: string, decimals: number) => {
  if (decimals === 0) return raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const cleaned = raw.replace(/[^\d,]/g, "");
  const [int, ...rest] = cleaned.split(",");
  const head = int.replace(/^0+(?=\d)/, "");
  return rest.length ? `${head || "0"}.${rest.join("").slice(0, decimals)}` : head;
};

type Props = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type"> & {
  value?: string;
  defaultValue?: string | number | null;
  onValueChange?: (digits: string) => void;
  /** jumlah angka desimal yang boleh diisi (0 = bilangan bulat) */
  decimals?: number;
};

export function MoneyInput({ value, defaultValue, onValueChange, name, className, decimals = 0, ...props }: Props) {
  const [inner, setInner] = useState(decimals === 0 ? String(defaultValue ?? "").replace(/\D/g, "") : String(defaultValue ?? "").replace(/[^\d.]/g, ""));
  const digits = value ?? inner;

  return (
    <>
      <input
        {...props}
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        autoComplete="off"
        value={group(digits)}
        onChange={(e) => {
          const next = sanitize(e.target.value, decimals);
          setInner(next);
          onValueChange?.(next);
        }}
        className={cn("tabular-nums", className)}
      />
      {name && <input type="hidden" name={name} value={digits} />}
    </>
  );
}
