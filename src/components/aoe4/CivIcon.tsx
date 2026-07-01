"use client";

import { useState } from "react";

const FALLBACK: Record<string, string> = {
  blue:   "bg-blue-900/60 border-blue-700/40 text-blue-300",
  green:  "bg-green-900/60 border-green-700/40 text-green-300",
  amber:  "bg-amber-900/60 border-amber-700/40 text-amber-300",
  purple: "bg-purple-900/60 border-purple-700/40 text-purple-300",
};

interface Props {
  slug:      string;
  name:      string;
  basePath?: string;
  color?:    "blue" | "green" | "amber" | "purple";
}

export default function CivIcon({ slug, name, basePath = "/aoe4/civs/", color = "blue" }: Props) {
  const [failed, setFailed] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();

  if (failed) {
    return (
      <div className={`w-10 h-10 rounded border flex items-center justify-center text-[11px] font-black tracking-wider ${FALLBACK[color]}`}>
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${basePath}${slug}.webp`}
      alt={name}
      width={40}
      height={40}
      className="w-10 h-10 object-contain rounded"
      onError={() => setFailed(true)}
    />
  );
}
