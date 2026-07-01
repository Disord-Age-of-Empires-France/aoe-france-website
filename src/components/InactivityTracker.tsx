"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut, Clock } from "lucide-react";

const INACTIVE_MS = 30 * 60 * 1000; // 30 min d'inactivité → warning
const WARNING_MS  =  5 * 60 * 1000; //  5 min de warning → déconnexion

const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;

function formatTime(ms: number) {
  const s   = Math.ceil(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return min > 0 ? `${min}m ${String(sec).padStart(2, "0")}s` : `${sec}s`;
}

export default function InactivityTracker() {
  const [loggedIn,     setLoggedIn]     = useState(false);
  const [showWarning,  setShowWarning]  = useState(false);
  const [remaining,    setRemaining]    = useState(WARNING_MS);

  const warningRef    = useRef(false);   // ref pour éviter stale closures dans les listeners
  const inactiveTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadlineRef   = useRef(0);

  const logout = useCallback(() => {
    window.location.href = "/api/auth/logout";
  }, []);

  const startWarning = useCallback(() => {
    warningRef.current  = true;
    setShowWarning(true);
    deadlineRef.current = Date.now() + WARNING_MS;
    setRemaining(WARNING_MS);

    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      const rem = deadlineRef.current - Date.now();
      if (rem <= 0) {
        clearInterval(countdownInterval.current!);
        logout();
      } else {
        setRemaining(rem);
      }
    }, 500);
  }, [logout]);

  const resetTimer = useCallback(() => {
    warningRef.current = false;
    setShowWarning(false);
    setRemaining(WARNING_MS);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    if (inactiveTimer.current)     clearTimeout(inactiveTimer.current);
    inactiveTimer.current = setTimeout(startWarning, INACTIVE_MS - WARNING_MS);
  }, [startWarning]);

  // Vérifier si l'utilisateur est connecté (cookie httpOnly → on passe par l'API)
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => { if (data.loggedIn) setLoggedIn(true); })
      .catch(() => {});
  }, []);

  // Démarrer le tracking une fois connecté
  useEffect(() => {
    if (!loggedIn) return;
    resetTimer();
    return () => {
      if (inactiveTimer.current)     clearTimeout(inactiveTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [loggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listeners d'activité (stables, utilisent warningRef pour éviter stale closures)
  useEffect(() => {
    if (!loggedIn) return;
    function onActivity() {
      if (!warningRef.current) resetTimer();
    }
    EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    return () => EVENTS.forEach(e => window.removeEventListener(e, onActivity));
  }, [loggedIn, resetTimer]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="bg-surface border border-border-site rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Clock size={24} className="text-amber-400" />
          </div>
        </div>

        <h2 className="text-lg font-black tracking-tight text-foreground mb-2">
          Session inactive
        </h2>
        <p className="text-muted text-sm leading-relaxed mb-2">
          Vous allez être déconnecté automatiquement dans
        </p>
        <div className="text-4xl font-black tabular-nums text-amber-400 mb-3 tracking-tight">
          {formatTime(remaining)}
        </div>
        <p className="text-faint text-xs mb-6">
          Cliquez sur &quot;Rester connecté&quot; pour continuer votre session.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-2 border border-border-site text-faint hover:text-red-400 hover:border-red-800/40 text-sm font-semibold py-2.5 rounded transition-colors"
          >
            <LogOut size={14} />
            Déconnecter
          </button>
          <button
            type="button"
            onClick={resetTimer}
            className="flex-1 bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm py-2.5 rounded transition-colors"
          >
            Rester connecté
          </button>
        </div>
      </div>
    </div>
  );
}
