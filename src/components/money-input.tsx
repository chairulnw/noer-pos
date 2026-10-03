"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const group = (digits: string) => (digits ? Number(digits).toLocaleString("id-ID") : "");

type Props = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type"> & {
  value?: string;
  defaultValue?: string | number | null;
  onValueChange?: (digits: string) => void;
};

export function MoneyInput({ value, defaultValue, onValueChange, name, className, ...props }: Props) {
  const [inner, setInner] = useState(String(defaultValue ?? "").replace(/\D/g, ""));
  const digits = value ?? inner;

  return (
    <>
      <input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={group(digits)}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
          setInner(next);
          onValueChange?.(next);
        }}
        className={cn("tabular-nums", className)}
      />
      {name && <input type="hidden" name={name} value={digits} />}
    </>
  );
}
