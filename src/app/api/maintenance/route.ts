import { unstable_cache } from "next/cache";
import { getSettings } from "@/lib/db";

const getCachedMaintenance = unstable_cache(
  async () => {
    const settings = await getSettings();
    return { active: settings.maintenance.active, message: settings.maintenance.message };
  },
  ["maintenance-status"],
  { tags: ["maintenance"], revalidate: 30 }
);

export async function GET() {
  const data = await getCachedMaintenance();
  return Response.json(data);
}
