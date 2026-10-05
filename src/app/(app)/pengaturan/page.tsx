import Link from "next/link";
import { requireCapability } from "@/lib/require-role";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  await requireCapability("manage_users_settings");
  const settings = await getSettings();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold leading-11">Pengaturan Klinik</h1>
        <Link href="/audit" className="text-sm font-medium text-primary">Lihat audit log</Link>
      </header>
      <SettingsForm settings={settings} />
    </div>
  );
}
