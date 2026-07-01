import Link from "next/link";
import Image from "next/image";
import { Wrench } from "lucide-react";
import { getSettings } from "@/lib/db";
import MaintenanceCountdown from "@/components/maintenance/MaintenanceCountdown";

export const metadata = {
  title: "Maintenance | AoE France",
};

const DEFAULT_MESSAGE = "Le site est actuellement en maintenance. Nous revenons très bientôt !";

export default async function MaintenancePage() {
  const settings = await getSettings();

  const message = settings.maintenance.message || DEFAULT_MESSAGE;

  const discordInvite = settings.discordInvite;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      {/* Fond */}
      <div className="fixed inset-0 -z-10">
        <Image src="/bg.png" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(200,163,46,0.08)_0%,_transparent_65%)]" />
      </div>

      <div className="relative max-w-md w-full text-center">

        {/* Logo / icône */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <Wrench size={36} className="text-[#c8a32e]" />
            </div>
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8a32e] opacity-50" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#c8a32e]" />
            </span>
          </div>
        </div>

        {/* Titre */}
        <p className="text-[11px] font-bold tracking-widest text-[#c8a32e] uppercase mb-3">
          {settings.siteName}
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground mb-3">
          Maintenance en cours
        </h1>
        <div className="w-12 h-1 bg-[#c8a32e] rounded mx-auto mb-6" />

        {/* Message */}
        <p className="text-muted leading-relaxed mb-6">{message}</p>

        {/* Countdown */}
        {settings.maintenance.endAt && (
          <MaintenanceCountdown endAt={settings.maintenance.endAt} />
        )}

        {/* Discord */}
        {discordInvite && discordInvite !== "#discord" && (
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-5 mb-6">
            <p className="text-xs text-faint mb-3">
              Suivez nos annonces en temps réel sur Discord
            </p>
            <Link
              href={discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-sm px-5 py-2.5 rounded transition-colors"
            >
              <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                <path d="M13.552 1.052A13.27 13.27 0 0 0 10.268 0c-.148.264-.32.62-.438.902a12.24 12.24 0 0 0-3.658 0A10.07 10.07 0 0 0 5.73 0 13.31 13.31 0 0 0 2.444 1.055C.352 4.228-.215 7.32.068 10.367c1.406 1.03 2.77 1.657 4.11 2.067.332-.45.628-.93.882-1.435a8.67 8.67 0 0 1-1.39-.668c.117-.085.231-.174.341-.265 2.682 1.243 5.596 1.243 8.246 0 .112.091.226.18.341.265-.444.264-.914.49-1.392.67.254.504.549.983.882 1.434 1.342-.41 2.708-1.037 4.113-2.068.337-3.53-.576-6.592-2.45-9.315ZM5.34 8.49c-.79 0-1.437-.726-1.437-1.617 0-.89.63-1.618 1.437-1.618.806 0 1.452.728 1.437 1.618C6.778 7.764 6.147 8.49 5.34 8.49Zm5.317 0c-.79 0-1.437-.726-1.437-1.617 0-.89.63-1.618 1.437-1.618.806 0 1.452.728 1.437 1.618 0 .89-.63 1.617-1.437 1.617Z"/>
              </svg>
              Rejoindre notre Discord
            </Link>
          </div>
        )}

        <p className="text-[11px] text-faint">
          © {new Date().getFullYear()} {settings.siteName}
        </p>
      </div>
    </div>
  );
}
