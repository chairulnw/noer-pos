import { requireCapability } from "@/lib/require-role";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  await requireCapability("manage_users_settings");
  const settings = await getSettings();

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold leading-11">Pengaturan</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
