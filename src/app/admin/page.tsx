import Link from "next/link";
import { getArticles, getSettings } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import {
  Newspaper,
  CheckCircle,
  FileText,
  Settings,
  Plus,
  ExternalLink,
} from "lucide-react";
import DiscordIcon from "@/components/DiscordIcon";

export const metadata = { title: "Tableau de bord" };

function StatCard({
  label,
  value,
  icon: Icon,
  color = "gold",
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color?: "gold" | "green" | "blue" | "gray";
}) {
  const colors = {
    gold:  "text-[#c8a32e] bg-[#c8a32e]/10",
    green: "text-emerald-400 bg-emerald-400/10",
    blue:  "text-blue-400 bg-blue-400/10",
    gray:  "text-muted bg-border-site/30",
  };
  return (
    <div className="bg-surface border border-border-site rounded-lg p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-faint font-medium tracking-wide">{label}</div>
      </div>
    </div>
  );
}

const badgeClasses: Record<string, string> = {
  blue:   "bg-blue-800/60 text-blue-300",
  green:  "bg-green-800/60 text-green-300",
  amber:  "bg-amber-800/60 text-amber-300",
  purple: "bg-purple-800/60 text-purple-300",
  red:    "bg-red-800/60 text-red-300",
};

export default async function DashboardPage() {
  await requireBOAccess();
  const [articles, settings] = await Promise.all([getArticles(), getSettings()]);
  const published = articles.filter((a) => a.status === "published").length;
  const drafts    = articles.length - published;
  const recent    = articles.slice(0, 5);
  const discordOk = settings.discordInvite !== "#discord";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Tableau de bord</h1>
        <p className="text-faint text-sm mt-1">
          Bienvenue dans l&apos;espace d&apos;administration d&apos;Age of Empires France.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Articles total" value={articles.length} icon={Newspaper} color="gold" />
        <StatCard label="Publiés"        value={published}        icon={CheckCircle} color="green" />
        <StatCard label="Brouillons"     value={drafts}           icon={FileText}    color="gray" />
        <StatCard
          label="Discord"
          value={discordOk ? "Configuré" : "À configurer"}
          icon={DiscordIcon}
          color={discordOk ? "green" : "blue"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent articles */}
        <div className="lg:col-span-2 bg-surface border border-border-site rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-site">
            <h2 className="font-bold text-foreground text-sm tracking-wide">Derniers articles</h2>
            <Link href="/admin/actualites" className="text-[#c8a32e] hover:text-[#d4b040] text-xs font-medium transition-colors">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-border-site">
            {recent.length === 0 && (
              <p className="px-5 py-8 text-center text-faint text-sm">Aucun article.</p>
            )}
            {recent.map((article) => (
              <div key={article.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded shrink-0 ${badgeClasses[article.badgeColor] ?? badgeClasses.blue}`}>
                  {article.badge}
                </span>
                <span className="flex-1 text-sm text-muted truncate">{article.title}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${article.status === "published" ? "bg-emerald-900/50 text-emerald-400" : "bg-gray-800/50 text-gray-400"}`}>
                  {article.status === "published" ? "Publié" : "Brouillon"}
                </span>
                <Link href={`/admin/actualites/${article.id}`} className="text-faint hover:text-[#c8a32e] transition-colors">
                  <ExternalLink size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="bg-surface border border-border-site rounded-lg p-5">
            <h2 className="font-bold text-foreground text-sm tracking-wide mb-4">Actions rapides</h2>
            <div className="space-y-2.5">
              <Link href="/admin/actualites/nouveau" className="flex items-center gap-2.5 w-full bg-[#c8a32e]/10 hover:bg-[#c8a32e]/20 border border-[#c8a32e]/30 text-[#c8a32e] text-sm font-semibold px-4 py-2.5 rounded transition-colors">
                <Plus size={15} />Nouvel article
              </Link>
              <Link href="/admin/parametres" className="flex items-center gap-2.5 w-full bg-surface-2 hover:bg-surface-2 border border-border-site text-muted hover:text-foreground text-sm font-semibold px-4 py-2.5 rounded transition-colors">
                <Settings size={15} />Paramètres
              </Link>
              <a href="/" target="_blank" className="flex items-center gap-2.5 w-full bg-surface-2 hover:bg-surface-2 border border-border-site text-muted hover:text-foreground text-sm font-semibold px-4 py-2.5 rounded transition-colors">
                <ExternalLink size={15} />Voir le site
              </a>
            </div>
          </div>

          <div className="bg-surface border border-border-site rounded-lg p-5">
            <h2 className="font-bold text-foreground text-sm tracking-wide mb-3">Discord</h2>
            {!discordOk ? (
              <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-3 py-2">
                Lien non configuré.{" "}
                <Link href="/admin/parametres" className="underline">Configurer →</Link>
              </div>
            ) : (
              <div className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-3 py-2 break-all">
                {settings.discordInvite}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
