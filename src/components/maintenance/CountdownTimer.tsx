"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  endAt:     string;
  compact?:  boolean;
  onExpire?: () => void | Promise<void>;
}

interface TimeLeft {
  hours:   number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function compute(endAt: string): TimeLeft {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours:   Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownTimer({ endAt, compact, onExpire }: Props) {
  const [time, setTime] = useState<TimeLeft>(() => compute(endAt));
  const firedRef = useRef(false);

  useEffect(() => {
    if (time.expired) return;
    const id = setInterval(() => setTime(compute(endAt)), 1000);
    return () => clearInterval(id);
  }, [endAt, time.expired]);

  useEffect(() => {
    if (time.expired && onExpire && !firedRef.current) {
      firedRef.current = true;
      onExpire();
    }
  }, [time.expired, onExpire]);

  if (time.expired) return null;

  if (compact) {
    return (
      <span className="tabular-nums font-mono text-red-400 text-[11px] font-bold">
        {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
      </span>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-5 mb-6">
      <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">
        Retour estimé dans
      </p>
      <div className="flex items-center justify-center gap-3">
        {[
          { value: time.hours,   label: "heures" },
          { value: time.minutes, label: "min" },
          { value: time.seconds, label: "sec" },
        ].map(({ value, label }, i) => (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && <span className="text-faint text-xl font-bold">:</span>}
            <div className="text-center">
              <div className="text-3xl font-black tracking-tight text-foreground w-16 tabular-nums">
                {pad(value)}
              </div>
              <div className="text-[10px] text-faint uppercase tracking-wider mt-1">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
