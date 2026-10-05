import Link from "next/link";
import { PawPrint } from "lucide-react";
import { ListHeader, ListPage, ListToolbar, TableCard } from "@/components/data-table";
import { EmptyState } from "@/components/page-header";
import { Search } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ClinicalTags } from "@/components/clinical-flags";
import { cn } from "@/lib/utils";
import { parsePaging, type PagingParams } from "@/lib/paging";
import { getPatient, getPatientHistory, pagePatients, searchPatients } from "@/lib/patients";
import { latestRawatInapLogs, listPatientAdmissions } from "@/lib/admissions";
import { can } from "@/lib/permissions";
import { formatWhatsapp } from "@/lib/patient-schema";
import { requireCapability } from "@/lib/require-role";
import { PatientProfile } from "./patient-profile";

const SEX = { JANTAN: "Jantan", BETINA: "Betina" };

async function PatientTable({ params }: { params: { q?: string } & PagingParams }) {
  const { page, size, skip, take } = parsePaging(params);
  const { rows, total } = await pagePatients(params.q ?? "", skip, take);
  const keep = { q: params.q, baris: params.baris };
  const add = <Button asChild><Link href="/pemilik/baru">+ Pasien Baru</Link></Button>;

  return (
    <ListPage>
      <ListHeader icon={PawPrint} title="Pasien & Anabul" subtitle="Daftar identitas hewan pasien klinik, pemilik, jenis, ras, dan profil klinis" actions={add} />
      <ListToolbar base="/pasien" params={keep} placeholder="Cari nama hewan, pemilik, no. WA, no. RM, microchip…" total={total} />
      <TableCard
        columns={[{ label: "Nama pasien (anabul)" }, { label: "Jenis & ras" }, { label: "Jenis kelamin" }, { label: "Pemilik (owner)" }, { label: "Berat badan", align: "right" }, { label: "Aksi", align: "right" }]}
        total={total}
        page={page}
        size={size}
        base="/pasien"
        params={keep}
        minWidth={800}
        empty={<EmptyState action={add}>{params.q ? "Tidak ada pasien ditemukan." : "Belum ada data pasien. Mulai daftarkan pemilik, lalu tambahkan hewannya."}</EmptyState>}
      >
        {rows.map((p) => (
          <tr key={p.id} className="border-b last:border-0">
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link href={`/pasien?id=${p.id}`} className="font-medium">{p.name}</Link>
                <ClinicalTags allergyNote={p.allergyNote} aggressive={p.aggressive} />
              </div>
              <div className="text-[13px] text-muted-foreground">{p.rmNo}</div>
            </td>
            <td className="px-4 py-3">{[p.species, p.breed].filter(Boolean).join(" · ")}</td>
            <td className="px-4 py-3">{SEX[p.sex]}</td>
            <td className="px-4 py-3"><Link href={`/pemilik/${p.owner.id}`} className="font-medium">{p.owner.name}</Link><div className="text-[13px] text-muted-foreground">{formatWhatsapp(p.owner.whatsapp)}</div></td>
            <td className="px-4 py-3 text-right tabular-nums">{p.lastWeightKg === null ? "—" : `${p.lastWeightKg.toLocaleString("id-ID")} kg`}</td>
            <td className="px-4 py-3 text-right"><Link href={`/pasien?id=${p.id}`} className="inline-flex min-h-11 items-center px-2 font-medium text-primary">Profil</Link></td>
          </tr>
        ))}
      </TableCard>
    </ListPage>
  );
}

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string; id?: string } & PagingParams> }) {
  const user = await requireCapability("manage_patients");
  const params = await searchParams;
  const { q = "", id } = params;
  if (!id || !z.guid().safeParse(id).success) return <PatientTable params={params} />;
  const [{ patients, ownersWithoutPets }, selected] = await Promise.all([
    searchPatients(q),
    id && z.guid().safeParse(id).success ? getPatient(id) : null,
  ]);
  const history = selected && can(user.role, "view_medical_record") ? await getPatientHistory(selected.id) : null;
  const admissions = selected ? await listPatientAdmissions(selected.id) : [];
  const monitoring = selected && can(user.role, "monitor_admission") ? await latestRawatInapLogs(selected.id) : null;
  const total = patients.length + ownersWithoutPets.length;
  const href = (patientId: string) => `/pasien?${new URLSearchParams({ ...(q && { q }), id: patientId })}`;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold leading-11">Hewan Peliharaan</h1>
        <Button asChild>
          <Link href="/pemilik/baru">+ Owner baru</Link>
        </Button>
      </header>

      <div>
        <form className="flex h-11 w-full items-center gap-2.5 rounded-lg border border-input bg-card px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <Search className="size-[18px] text-muted-foreground" />
          <input
            name="q"
            data-search
            defaultValue={q}
            aria-label="Cari hewan atau pemilik"
            placeholder="Nama owner/hewan, no. WA, no. RM, microchip"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
          <span className="text-[13px] text-muted-foreground">{q ? `${total} hasil` : "Terbaru"}</span>
        </form>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section aria-label="Hasil pencarian" className="min-w-0 flex-1 basis-72 overflow-hidden rounded-[10px] border bg-card md:max-w-sm">
          {total === 0 && <EmptyState action={<Button asChild variant="outline"><Link href="/pemilik/baru">+ Owner baru</Link></Button>}>Tidak ada pasien ditemukan.</EmptyState>}
          {patients.map((p) => (
            <Link
              key={p.id}
              href={href(p.id)}
              className={cn("flex flex-col gap-1 border-b px-4 py-3.5 last:border-0", p.id === selected?.id && "bg-accent")}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[15px] font-semibold">{p.name}</span>
                <ClinicalTags allergyNote={p.allergyNote} aggressive={p.aggressive} />
              </div>
              <div className="text-[13.5px] text-muted-foreground">
                {[p.species, p.breed, p.rmNo].filter(Boolean).join(" · ")}
              </div>
              <div className="text-[13.5px] text-muted-foreground">
                {p.owner.name} · {formatWhatsapp(p.owner.whatsapp)}
              </div>
            </Link>
          ))}
          {ownersWithoutPets.map((o) => (
            <Link key={o.id} href={`/pemilik/${o.id}`} className="flex flex-col gap-1 border-b px-4 py-3.5 last:border-0">
              <span className="text-[15px] font-semibold">{o.name}</span>
              <span className="text-[13.5px] text-muted-foreground">Owner, belum ada hewan · {formatWhatsapp(o.whatsapp)}</span>
            </Link>
          ))}
        </section>

        <div className="min-w-0 flex-[999] basis-[520px]">
          {selected ? (
            <PatientProfile patient={selected} history={history} admissions={admissions} monitoring={monitoring} />
          ) : (
            <p className="rounded-[10px] border bg-card p-8 text-center text-sm text-muted-foreground">
              Pilih pasien untuk melihat profil.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
