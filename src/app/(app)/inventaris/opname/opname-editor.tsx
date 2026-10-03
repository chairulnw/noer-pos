"use client";

import { useState, useTransition } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { opnameDiff } from "@/lib/stock";
import { finalizeOpnameAction, saveOpnameAction, type OpnameResult } from "./actions";

export type OpnameRow = { id: string; name: string; batchNo: string; expiry: string | null; unit: string; system: number; counted: number; reason: string };

const fmt = (n: number) => n.toLocaleString("id-ID");

export function OpnameEditor({ opnameId, initial }: { opnameId: string; initial: OpnameRow[] }) {
  const [rows, setRows] = useState(initial);
  const [message, setMessage] = useState<{ text: string; ok: boolean }>();
  const [pending, startTransition] = useTransition();

  const payload = rows.map((r) => ({ id: r.id, counted: r.counted, reason: r.reason }));
  const update = (id: string, patch: Partial<OpnameRow>) => setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const withDiff = rows.filter((r) => opnameDiff(r.system, r.counted) !== 0);

  const run = (fn: () => Promise<OpnameResult>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      setMessage(result.error ? { text: result.error, ok: false } : { text: success, ok: true });
      if (!result.error) toast(success);
    });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[10px] border bg-card">
        <table className="w-full min-w-[700px] text-[14.5px]">
          <thead>
            <tr className="border-b text-left text-[13px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Produk / batch</th>
              <th className="px-4 py-2.5 font-normal">Expired</th>
              <th className="px-4 py-2.5 text-right font-normal">Sistem</th>
              <th className="px-4 py-2.5 font-normal">Hitung fisik</th>
              <th className="px-4 py-2.5 text-right font-normal">Selisih</th>
              <th className="px-4 py-2.5 font-normal">Alasan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const diff = opnameDiff(r.system, r.counted);
              return (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-[13px] text-muted-foreground">Batch {r.batchNo}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.expiry ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(r.system)} {r.unit}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      aria-label={`Hitung fisik ${r.name} ${r.batchNo}`}
                      value={Number.isNaN(r.counted) ? "" : r.counted}
                      onChange={(e) => update(r.id, { counted: e.target.value === "" ? NaN : Number(e.target.value) })}
                      className="h-11 w-28 rounded-lg border border-input bg-card px-2.5 tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </td>
                  <td className={`px-4 py-3 text-right font-medium tabular-nums ${diff < 0 ? "text-destructive" : diff > 0 ? "text-success" : "text-muted-foreground"}`}>
                    {Number.isNaN(diff) ? "—" : `${diff > 0 ? "+" : ""}${fmt(diff)}`}
                  </td>
                  <td className="px-4 py-3">
                    {diff !== 0 && !Number.isNaN(diff) ? (
                      <input
                        aria-label={`Alasan selisih ${r.name} ${r.batchNo}`}
                        placeholder="Alasan (wajib)"
                        value={r.reason}
                        onChange={(e) => update(r.id, { reason: e.target.value })}
                        className="h-11 w-full min-w-44 rounded-lg border border-input bg-card px-2.5 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {message && <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-destructive"}`}>{message.text}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => run(() => saveOpnameAction(opnameId, payload), "Draft opname tersimpan.")}>
          Simpan draft
        </Button>
        <ConfirmButton
          size="lg"
          disabled={pending || rows.some((r) => Number.isNaN(r.counted))}
          confirmLabel="Ya, finalkan"
          message={`Finalkan opname? ${withDiff.length} batch akan disesuaikan dan opname tidak bisa diubah lagi.`}
          onConfirm={() => run(() => finalizeOpnameAction(opnameId, payload), "Opname difinalkan.")}
        >
          {pending ? "Memproses…" : "Finalkan opname"}
        </ConfirmButton>
      </div>
    </div>
  );
}
