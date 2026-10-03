"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckField, Field, Section, selectClass } from "@/components/form-fields";
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES, type ItemView } from "@/lib/item-schema";
import { keepValuesOnError } from "@/lib/form";
import { saveItemAction, type FormState } from "./actions";

type ItemType = "SERVICE" | "PRODUCT";

export function ItemForm({ item }: { item: ItemView | null }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveItemAction.bind(null, item?.id ?? null),
    {},
  );
  const [type, setType] = useState<ItemType>(item?.type ?? "PRODUCT");
  const [category, setCategory] = useState(item?.category ?? "obat");
  const err = (key: string) => state.errors?.[key];
  const isProduct = type === "PRODUCT";
  const categories = isProduct ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES;

  function changeType(next: ItemType) {
    setType(next);
    setCategory((next === "PRODUCT" ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES)[0]);
  }

  return (
    <form onSubmit={keepValuesOnError(formAction)} className="max-w-3xl space-y-5">
      <Section title="Identitas">
        <Field label="Jenis" name="type" errors={err("type")}>
          {item ? (
            <>
              <input type="hidden" name="type" value={type} />
              <p className="flex h-11 items-center text-sm">{isProduct ? "Produk" : "Layanan"}</p>
            </>
          ) : (
            <select id="type" name="type" value={type} onChange={(e) => changeType(e.target.value as ItemType)} className={selectClass}>
              <option value="PRODUCT">Produk</option>
              <option value="SERVICE">Layanan</option>
            </select>
          )}
        </Field>
        <Field label="Kategori" name="category" errors={err("category")}>
          <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={`${selectClass} capitalize`}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nama" name="name" errors={err("name")} full>
          <Input id="name" name="name" defaultValue={item?.name} required />
        </Field>
        <Field label="SKU (opsional)" name="sku" errors={err("sku")}>
          <Input id="sku" name="sku" defaultValue={item?.sku ?? ""} />
        </Field>
        <Field label="Barcode (opsional)" name="barcode" errors={err("barcode")}>
          <Input id="barcode" name="barcode" defaultValue={item?.barcode ?? ""} />
        </Field>
      </Section>

      <Section title="Harga & satuan">
        <Field label="Harga jual (Rp)" name="sellPrice" errors={err("sellPrice")}>
          <Input id="sellPrice" name="sellPrice" type="number" min={0} step={1} defaultValue={item?.sellPrice} required />
        </Field>
        {isProduct && (
          <Field label="Harga beli (Rp)" name="buyPrice" errors={err("buyPrice")} hint="Per satuan dasar.">
            <Input id="buyPrice" name="buyPrice" type="number" min={0} step={1} defaultValue={item?.buyPrice} required />
          </Field>
        )}
        <Field label="Satuan dasar" name="baseUnit" errors={err("baseUnit")} hint={isProduct ? "Satuan terkecil, mis. tablet, ml, pcs." : "Mis. kali, hari."}>
          <Input id="baseUnit" name="baseUnit" defaultValue={item?.baseUnit} required />
        </Field>
        {isProduct && (
          <>
            <Field label="Satuan beli (opsional)" name="purchaseUnit" errors={err("purchaseUnit")} hint="Mis. box, botol.">
              <Input id="purchaseUnit" name="purchaseUnit" defaultValue={item?.purchaseUnit ?? ""} />
            </Field>
            <Field label="Faktor konversi" name="conversionFactor" errors={err("conversionFactor")} hint="Jumlah satuan dasar dalam 1 satuan beli.">
              <Input id="conversionFactor" name="conversionFactor" type="number" min={0} step="any" defaultValue={item?.conversionFactor ?? 1} />
            </Field>
            <Field label="Batas stok rendah" name="lowStockThreshold" errors={err("lowStockThreshold")} hint="Dalam satuan dasar. Kosongkan jika tidak dipantau.">
              <Input id="lowStockThreshold" name="lowStockThreshold" type="number" min={0} step="any" defaultValue={item?.lowStockThreshold ?? ""} />
            </Field>
            <CheckField name="trackExpiry" label="Lacak tanggal expired per batch" defaultChecked={item?.trackExpiry ?? true} />
          </>
        )}
        {!isProduct && <CheckField name="perDay" label="Tarif per hari (rawat inap / hotel)" defaultChecked={item?.billingUnit === "PER_DAY"} />}
        {category === "vaksin" && (
          <Field label="Interval vaksin berikutnya (hari)" name="vaccineIntervalDays" errors={err("vaccineIntervalDays")}>
            <Input id="vaccineIntervalDays" name="vaccineIntervalDays" type="number" min={1} step={1} defaultValue={item?.vaccineIntervalDays ?? ""} />
          </Field>
        )}
      </Section>

      <Section title="Status">
        <CheckField name="active" label="Aktif (bisa dipilih di kunjungan dan kasir)" defaultChecked={item?.active ?? true} />
      </Section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/master-data/item">Batal</Link>
        </Button>
        {state.message && <p role="status" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
