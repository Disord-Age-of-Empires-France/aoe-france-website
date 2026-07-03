"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface Props {
  path:       string;    // ex: "/actualites/123"
  title:      string;
  compact?:   boolean;   // icône seule, pour les cartes
  className?: string;
}

export default function ShareButton({ path, title, compact, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = window.location.origin + path;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { /* annulé */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* pas de permissions */ }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleShare}
        title={copied ? "Lien copié !" : "Partager"}
        className={`p-1.5 rounded-md text-faint hover:text-[#c8a32e] hover:bg-black/30 transition-colors ${className ?? ""}`}
      >
        {copied ? <Check size={13} /> : <Share2 size={13} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-border-site text-muted hover:border-[#c8a32e]/40 hover:text-[#c8a32e] text-sm font-medium transition-colors ${className ?? ""}`}
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? "Lien copié !" : "Partager"}
    </button>
  );
}
