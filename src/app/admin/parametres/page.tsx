import { getSettings, getBotCommands } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import SettingsForm from "@/components/admin/SettingsForm";

export const metadata = { title: "Paramètres" };

export default async function ParametresPage() {
  await requireBOAccess();
  const [settings, commands] = await Promise.all([getSettings(), getBotCommands()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Paramètres</h1>
        <p className="text-faint text-sm mt-1">Configuration générale du site.</p>
      </div>
      <SettingsForm initialSettings={settings} commands={commands} />
    </div>
  );
}
