"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-[12px] text-faint hover:text-[#c8a32e] transition-colors mb-4"
    >
      <ArrowLeft size={13} />
      Retour
    </button>
  );
}
