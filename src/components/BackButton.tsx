"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-2 shrink-0 text-sm font-semibold text-muted hover:text-[#c8a32e] transition-colors"
    >
      <ArrowLeft size={15} />
      Retour
    </button>
  );
}
