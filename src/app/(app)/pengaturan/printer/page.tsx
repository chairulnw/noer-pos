import { Printer } from "lucide-react";
import { ListHeader } from "@/components/data-table";
import { requireCapability } from "@/lib/require-role";
import { getSettings } from "@/lib/settings";
import { PrinterForm } from "./printer-form";

export default async function PrinterPage() {
  await requireCapability("manage_users_settings");
  const settings = await getSettings();
  return (
    <div className="space-y-5">
      <ListHeader icon={Printer} title="Pengaturan Printer" subtitle="Ukuran kertas struk kasir dan uji cetak" />
      <PrinterForm initial={settings.paperWidth} clinicName={settings.clinicName} />
    </div>
  );
}
