import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrintButton } from "@/components/print-button";
import { todayJakarta } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { getPatient, getPatientHistory } from "@/lib/patients";
import { formatAge, formatWhatsapp } from "@/lib/patient-schema";
import { requireCapability } from "@/lib/require-role";
import { getSettings } from "@/lib/settings";

const SEX = { JANTAN: "Jantan", BETINA: "Betina" };

export default async function PatientPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCapability("manage_patients");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const patient = await getPatient(id);
  if (!patient) notFound();
  const [history, settings] = await Promise.all([can(user.role, "view_medical_record") ? getPatientHistory(id) : null, getSettings()]);
  const rows: [string, string][] = [
    ["No. RM", patient.rmNo],
    ["Jenis / ras", `${patient.species}${patient.breed ? ` / ${patient.breed}` : ""}`],
    ["Kelamin", `${SEX[patient.sex]}${patient.neutered ? " (steril)" : ""}`],
    ["Umur", patient.birthDate ? `${formatAge(patient.birthDate, todayJakarta())} (lahir ${formatDate(patient.birthDate)})` : "-"],
    ["Berat terakhir", patient.lastWeightKg === null ? "-" : `${patient.lastWeightKg.toLocaleString("id-ID")} kg`],
    ["Warna / microchip", `${patient.color || "-"} / ${patient.microchip || "-"}`],
    ["Pemilik", `${patient.owner.name} · ${formatWhatsapp(patient.owner.whatsapp)}`],
    ["Alergi", patient.allergyNote || "Tidak ada"],
    ["Catatan khusus", [patient.aggressive && "Agresif", patient.behaviorNote].filter(Boolean).join(". ") || "-"],
  ];

  return (
    <div>
      <style>{`@media print { body * { visibility: hidden; } #patient-sheet, #patient-sheet * { visibility: visible; } #patient-sheet { position: absolute; left: 0; top: 0; width: 100%; border: 0; } }`}</style>
      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        <Link href={`/pasien/${id}`} className="text-[13px] font-medium text-primary">← Profil hewan</Link>
        <PrintButton />
        <span className="text-[13px] text-muted-foreground">Pilih &quot;Simpan sebagai PDF&quot; di dialog cetak untuk menyimpan file.</span>
      </div>
      <article id="patient-sheet" className="mx-auto max-w-3xl space-y-5 rounded-xl border bg-white p-8 text-[13px] text-black">
        <header className="border-b pb-3">
          <div className="text-lg font-bold">{settings.clinicName}</div>
          <div>{[settings.address, settings.phone && `Telp ${settings.phone}`].filter(Boolean).join(" · ")}</div>
          <div className="mt-2 text-base font-semibold">Ringkasan Rekam Medis: {patient.name}</div>
          <div className="text-[12px]">Dicetak {formatDate(new Date())}</div>
        </header>
        <table className="w-full"><tbody>{rows.map(([k, v]) => <tr key={k}><td className="w-40 py-0.5 align-top font-semibold">{k}</td><td className="py-0.5">{v}</td></tr>)}</tbody></table>
        {history && (
          <>
            <section>
              <h2 className="mb-1 font-semibold">Riwayat kunjungan</h2>
              {history.visits.length === 0 ? <p>-</p> : (
                <table className="w-full border-collapse">
                  <thead><tr className="border-b text-left"><th className="py-1">Tanggal</th><th>Dokter</th><th>Keluhan</th><th>Diagnosis</th></tr></thead>
                  <tbody>{history.visits.map((v) => <tr key={v.id} className="border-b align-top"><td className="py-1 pr-2 whitespace-nowrap">{formatDate(v.visitDate)}</td><td className="pr-2">{v.doctor.name}</td><td className="pr-2">{v.complaint}</td><td>{v.medicalRecord?.diagnosis || "-"}</td></tr>)}</tbody>
                </table>
              )}
            </section>
            <section>
              <h2 className="mb-1 font-semibold">Vaksinasi</h2>
              {history.vaccinations.length === 0 ? <p>-</p> : (
                <table className="w-full border-collapse">
                  <thead><tr className="border-b text-left"><th className="py-1">Tanggal</th><th>Vaksin</th><th>Batch</th><th>Ulang</th></tr></thead>
                  <tbody>{history.vaccinations.map((v) => <tr key={v.id} className="border-b"><td className="py-1">{formatDate(v.givenAt)}</td><td>{v.item.name}</td><td>{v.batchNo || "-"}</td><td>{v.nextDue ? formatDate(v.nextDue) : "-"}</td></tr>)}</tbody>
                </table>
              )}
            </section>
            <section>
              <h2 className="mb-1 font-semibold">Hasil lab & radiologi</h2>
              {history.examinations.length === 0 ? <p>-</p> : history.examinations.map((e) => <p key={e.id}>{formatDate(e.performedAt)} · {e.type === "LAB" ? "Lab" : "Radiologi"} · {e.name}{e.findings && `: ${e.findings}`}</p>)}
            </section>
          </>
        )}
      </article>
    </div>
  );
}
