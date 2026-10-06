import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { formatDate } from "@/lib/format";
import { getOpname } from "@/lib/opname";
import { requireCapability } from "@/lib/require-role";
import { OpnameEditor } from "../opname-editor";

export default async function OpnameSessionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("manage_stock");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const opname = await getOpname(id);
  if (!opname) notFound();
  const final = opname.status === "FINAL";

  const rows = opname.items.map((i) => ({
    id: i.id,
    name: i.batch.item.name,
    batchNo: i.batch.batchNo,
    expiry: i.batch.expiryDate ? formatDate(i.batch.expiryDate) : null,
    unit: i.batch.item.baseUnit,
    system: Number(i.systemQty),
    counted: Number(i.countedQty),
    reason: i.reason ?? "",
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        back={{ href: "/inventaris/opname", label: "Stok Opname" }}
        title={`Opname ${formatDate(opname.opnameDate)}`}
        status={<StatusChip tone={final ? "info" : "neutral"}>{final ? "Final" : "Draft"}</StatusChip>}
        meta={
          <>
            <p>{opname.user.name}{opname.note && ` · ${opname.note}`}</p>
            {!final && <p>Isi hitung fisik per batch. Batch yang tidak diubah dianggap sesuai. Selisih memerlukan alasan sebelum difinalkan.</p>}
          </>
        }
      />

      {final ? (
        <div className="overflow-x-auto rounded-[10px] border bg-card">
          <table className="w-full min-w-[600px] text-[13.5px]">
            <thead>
              <tr className="border-b text-left text-[12.5px] text-muted-foreground">
                <th className="px-4 py-2.5 font-normal">Produk / batch</th>
                <th className="px-4 py-2.5 text-right font-normal">Sistem</th>
                <th className="px-4 py-2.5 text-right font-normal">Hitung fisik</th>
                <th className="px-4 py-2.5 text-right font-normal">Selisih</th>
                <th className="px-4 py-2.5 font-normal">Alasan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const diff = r.counted - r.system;
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-3"><div className="font-medium">{r.name}</div><div className="text-[12.5px] text-muted-foreground">Batch {r.batchNo}</div></td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.system.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.counted.toLocaleString("id-ID")}</td>
                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${diff < 0 ? "text-destructive" : diff > 0 ? "text-success" : "text-muted-foreground"}`}>{diff === 0 ? "0" : `${diff > 0 ? "+" : ""}${diff.toLocaleString("id-ID")}`}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.reason || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <OpnameEditor key={JSON.stringify(rows.map((r) => [r.counted, r.system, r.reason]))} opnameId={opname.id} initial={rows} />
      )}
    </div>
  );
}
