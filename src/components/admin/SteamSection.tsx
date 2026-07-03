"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Unlink } from "lucide-react";
import { steamUnlinkAction } from "@/app/actions/users";

interface Props {
  steamId:       string | null;
  steamUsername: string;
  steamAvatar:   string;
}

export function SteamLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="white" aria-hidden>
      <path d="M16 2C8.3 2 2 8.3 2 16c0 6.6 4.3 12.2 10.2 14.2l3.7-8.6a4.1 4.1 0 1 1 5-5.3l8.8-3.6C28.5 5.9 22.7 2 16 2z"/>
      <circle cx="20.3" cy="11.7" r="3"/>
      <circle cx="11.6" cy="20.4" r="2.8"/>
    </svg>
  );
}

export default function SteamSection({ steamId, steamUsername, steamAvatar }: Props) {
  const [linked,   setLinked]   = useState(!!steamId);
  const [username, setUsername] = useState(steamUsername);
  const [avatar,   setAvatar]   = useState(steamAvatar);
  const [storedId, setStoredId] = useState(steamId);
  const [pending, startTransition] = useTransition();

  function unlink() {
    startTransition(async () => {
      const result = await steamUnlinkAction();
      if (!result?.error) { setLinked(false); setUsername(""); setAvatar(""); setStoredId(null); }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-background border border-border-site rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-[#1b2838] flex items-center justify-center shrink-0">
          <SteamLogo />
        </div>
        {linked ? (
          <div className="flex items-center gap-2.5">
            {avatar && <img src={avatar} alt={username} className="w-8 h-8 rounded-full border border-border-site" />}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">{username}</p>
              <a href={`https://steamcommunity.com/profiles/${storedId}`} target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-faint hover:text-[#c8a32e] transition-colors flex items-center gap-1">
                <ExternalLink size={10} /> Voir le profil Steam
              </a>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-foreground">Steam</p>
            <p className="text-[11px] text-faint">Non connecté</p>
          </div>
        )}
      </div>
      {linked ? (
        <button type="button" onClick={unlink} disabled={pending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-50">
          <Unlink size={11} /> Délier
        </button>
      ) : (
        <a href="/api/steam/connect"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#1b2838]/60 bg-[#1b2838]/10 text-[#c6d4df] text-xs font-semibold hover:bg-[#1b2838]/20 transition-colors">
          <SteamLogo /> Lier Steam
        </a>
      )}
    </div>
  );
}
