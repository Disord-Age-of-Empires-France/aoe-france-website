import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/lib/db";

// Appelé par un service cron externe (Vercel Cron, GitHub Actions, cron-job.org…)
// Optionnel : protéger avec CRON_SECRET dans les variables d'environnement.
//
// Exemple Vercel Cron (vercel.json) :
//   { "crons": [{ "path": "/api/cron", "schedule": "* * * * *" }] }
//
// Exemple GitHub Actions (.github/workflows/cron.yml) :
//   on: { schedule: [{ cron: "* * * * *" }] }
//   curl -s "$SITE_URL/api/cron?secret=$CRON_SECRET"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.nextUrl.searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // getArticles() appelle publishScheduledArticles() en interne
  await getArticles();

  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
