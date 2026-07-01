"use client";

import { useRouter } from "next/navigation";
import CountdownTimer from "@/components/maintenance/CountdownTimer";
import { disableMaintenanceAction } from "@/app/actions/maintenance";

interface Props {
  endAt:    string;
  compact?: boolean;
  /** "redirect" → redirige vers "/" (page maintenance) | "refresh" → rafraîchit la page courante (bandeau) */
  mode?:    "redirect" | "refresh";
}

export default function MaintenanceCountdown({ endAt, compact, mode = "redirect" }: Props) {
  const router = useRouter();

  async function handleExpire() {
    await disableMaintenanceAction();
    if (mode === "redirect") {
      router.push("/");
    } else {
      router.refresh();
    }
  }

  return <CountdownTimer endAt={endAt} compact={compact} onExpire={handleExpire} />;
}
