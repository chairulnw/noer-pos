"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, inputClass } from "@/components/ui/input";
import { MoneyInput } from "@/components/money-input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section, selectClass } from "@/components/form-fields";
import { keepValuesOnError } from "@/lib/form";
import { receiveStockAction, type StockFormState } from "./actions";

type Product = { id: string; name: string; baseUnit: string; purchaseUnit: string | null; factor: number; trackExpiry: boolean };

export function StockInForm({ products, defaultItemId }: { products: Product[]; defaultItemId?: string }) {
  const [state, formAction, pending] = useActionState<StockFormState, FormData>(receiveStockAction, {});
  const [itemId, setItemId] = useState(defaultItemId ?? "");
  const [qty, setQty] = useState("");
  const product = products.find((p) => p.id === itemId);
  const err = (key: string) => state.errors?.[key];
  const unit = product?.purchaseUnit ?? product?.baseUnit;
  const base = product && Number(qty) > 0 ? Math.round(Number(qty.replace(",", ".")) * (product.purchaseUnit ? product.factor : 1) * 1000) / 1000 : null;

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="max-w-4xl space-y-5">
      <Section title="Stok masuk">
        <Field label="Produk" name="itemId" errors={err("itemId")} full>
          <select id="itemId" name="itemId" value={itemId} onChange={(e) => setItemId(e.target.value)} className={selectClass} required>
            <option value="" disabled>
              Pilih produk
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Jumlah${unit ? ` (${unit})` : ""}`} name="qty" errors={err("qty")} hint={base !== null && product && product.purchaseUnit ? `= ${base.toLocaleString("id-ID")} ${product.baseUnit}` : undefined}>
          <Input id="qty" name="qty" type="number" min={0} step="any" value={qty} onChange={(e) => setQty(e.target.value)} required />
        </Field>
        <Field label={`Harga beli per ${unit ?? "satuan beli"} (Rp)`} name="price" errors={err("price")}>
          <MoneyInput id="price" name="price" className={inputClass} required />
        </Field>
        <Field label="No. batch" name="batchNo" errors={err("batchNo")}>
          <Input id="batchNo" name="batchNo" required />
        </Field>
        {(!product || product.trackExpiry) && (
          <Field label="Tanggal expired" name="expiry" errors={err("expiry")} hint={product ? undefined : "Wajib untuk produk yang melacak expired."}>
            <Input id="expiry" name="expiry" type="date" required={product?.trackExpiry} />
          </Field>
        )}
        <Field label="Catatan (mis. nama pemasok)" name="note" errors={err("note")} full>
          <Textarea id="note" name="note" rows={2} />
        </Field>
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan stok masuk"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/inventaris">Batal</Link>
        </Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
