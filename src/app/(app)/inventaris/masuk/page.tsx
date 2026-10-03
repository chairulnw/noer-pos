import { z } from "zod";
import { listStockInProducts } from "@/lib/inventory";
import { requireCapability } from "@/lib/require-role";
import { StockInForm } from "../stock-in-form";

export default async function StockInPage({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  await requireCapability("manage_stock");
  const { item } = await searchParams;
  const products = (await listStockInProducts()).map((p) => ({
    id: p.id, name: p.name, baseUnit: p.baseUnit, purchaseUnit: p.purchaseUnit, factor: Number(p.conversionFactor), trackExpiry: p.trackExpiry,
  }));

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Stok masuk</h1>
      <StockInForm products={products} defaultItemId={item && z.guid().safeParse(item).success ? item : undefined} />
    </div>
  );
}
