import Link from "next/link";
import { redirect } from "next/navigation";
import { RowLink } from "@/components/row-link";
import { PawPrint } from "lucide-react";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ClinicalTags } from "@/components/clinical-flags";
import { parsePaging, parseSort, type PagingParams, type SortParams } from "@/lib/paging";
import { pagePatients } from "@/lib/patients";
import { formatWhatsapp } from "@/lib/patient-schema";
import { requireCapability } from "@/lib/require-role";

const SEX = { JANTAN: "Jantan", BETINA: "Betina" };

async function PatientTable({ params }: { params: { q?: string } & PagingParams & SortParams }) {
  const { page, size, skip, take } = parsePaging(params);
  const sort = parseSort(params, { nama: (d) => ({ name: d }), jenis: (d) => ({ species: d }), kelamin: (d) => ({ sex: d }), pemilik: (d) => ({ owner: { name: d } }), berat: (d) => ({ lastWeightKg: { sort: d, nulls: "last" as const } }) });
  const { rows, total } = await pagePatients(params.q ?? "", skip, take, sort.orderBy);
  const keep = { q: params.q, baris: params.baris, ...sort.keep };
  const add = <Button asChild><Link href="/pasien/baru">+ Pasien Baru</Link></Button>;

  return (
    <ListPage>
      <ListHeader icon={PawPrint} title="Pasien & Anabul" subtitle="Daftar identitas hewan pasien klinik, pemilik, jenis, ras, dan profil klinis" actions={add} />
      <ListToolbar base="/pasien" params={keep} placeholder="Cari nama hewan, pemilik, no. WA, no. RM, microchip…" total={total} />
      <TableCard
        columns={[{ label: "Nama pasien (anabul)", sort: "nama" }, { label: "Jenis & ras", sort: "jenis" }, { label: "Jenis kelamin", sort: "kelamin" }, { label: "Pemilik (owner)", sort: "pemilik" }, { label: "Berat badan", sort: "berat", align: "right" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/pasien"
        params={keep}
        minWidth={800}
        empty={<EmptyState action={add}>{params.q ? "Tidak ada pasien ditemukan." : "Belum ada data pasien. Mulai daftarkan pemilik, lalu tambahkan hewannya."}</EmptyState>}
      >
        {rows.map((p) => (
          <RowLink key={p.id} href={`/pasien/${p.id}`} className="border-b last:border-0">
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {p.photoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/foto-hewan/${p.id}`} alt="" className="size-8 rounded-lg object-cover" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-lg bg-accent text-[13px] font-semibold text-primary">{p.name[0]?.toUpperCase()}</span>
                )}
                <Link href={`/pasien/${p.id}`} className="font-medium">{p.name}</Link>
                <ClinicalTags allergyNote={p.allergyNote} aggressive={p.aggressive} />
              </div>
              <div className="text-[12.5px] text-muted-foreground">{p.rmNo}</div>
            </td>
            <td className="px-4 py-3">{[p.species, p.breed].filter(Boolean).join(" · ")}</td>
            <td className="px-4 py-3">{SEX[p.sex]}</td>
            <td className="px-4 py-3"><Link href={`/pemilik/${p.owner.id}`} className="font-medium">{p.owner.name}</Link><div className="text-[12.5px] text-muted-foreground">{formatWhatsapp(p.owner.whatsapp)}</div></td>
            <td className="px-4 py-3 text-right tabular-nums">{p.lastWeightKg === null ? "—" : `${p.lastWeightKg.toLocaleString("id-ID")} kg`}</td>
            <td className="px-4 py-3 text-right"><Link href={`/pasien/${p.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Profil</Link></td>
          </RowLink>
        ))}
      </TableCard>
    </ListPage>
  );
}

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string; id?: string } & PagingParams & SortParams> }) {
  await requireCapability("manage_patients");
  const params = await searchParams;
  if (params.id && z.guid().safeParse(params.id).success) redirect(`/pasien/${params.id}`);
  return <PatientTable params={params} />;
}
