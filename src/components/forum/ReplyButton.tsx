"use client";

import { CornerDownLeft } from "lucide-react";

interface Props {
  username: string;
}

export default function ReplyButton({ username }: Props) {
  function handle() {
    document.dispatchEvent(
      new CustomEvent("forum:mention", { detail: { username } })
    );
    document.getElementById("reply-form")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-site text-xs font-semibold text-muted hover:border-[#c8a32e]/60 hover:text-[#c8a32e] hover:bg-[#c8a32e]/8 transition-all"
    >
      <CornerDownLeft size={12} />
      Répondre
    </button>
  );
}
