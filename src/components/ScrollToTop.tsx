"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";

const RADIUS       = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ScrollToTop() {
  const [visible,          setVisible]          = useState(false);
  const [progress,         setProgress]         = useState(0);
  const [displayProgress,  setDisplayProgress]  = useState(0);
  const [pulsing,          setPulsing]          = useState(false);
  const scrollingRef = useRef(false);

  useEffect(() => {
    function onScroll() {
      const scrollY   = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct       = maxScroll > 0 ? scrollY / maxScroll : 0;
      setProgress(pct);
      setVisible(scrollY > 400);

      // Quand l'utilisateur arrive en haut, on réinitialise
      if (scrollY === 0) scrollingRef.current = false;
      if (!scrollingRef.current) setDisplayProgress(pct);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleClick() {
    scrollingRef.current = true;
    setPulsing(true);
    // Vide l'anneau en douceur
    setDisplayProgress(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setPulsing(false), 700);
  }

  const offset = CIRCUMFERENCE * (1 - displayProgress);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Remonter en haut"
      className={`fixed bottom-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-surface shadow-xl group transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      {/* Onde dorée au clic */}
      {pulsing && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            animation: "scroll-pulse 0.65s ease-out forwards",
            border: "2px solid #c8a32e",
          }}
        />
      )}

      {/* Anneau de progression */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 48 48"
      >
        <circle
          cx="24" cy="24" r={RADIUS}
          fill="none" stroke="currentColor" strokeWidth="2.5"
          className="text-border-site"
        />
        <circle
          cx="24" cy="24" r={RADIUS}
          fill="none" stroke="#c8a32e" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            transition: scrollingRef.current
              ? "stroke-dashoffset 0.55s cubic-bezier(0.4,0,0.2,1)"
              : "stroke-dashoffset 0.15s ease",
          }}
        />
      </svg>

      {/* Icône */}
      <ChevronUp
        size={18}
        className={`relative transition-all duration-200 ${
          pulsing
            ? "text-[#c8a32e] -translate-y-1"
            : "text-muted group-hover:text-[#c8a32e] group-hover:-translate-y-0.5"
        }`}
      />

      <style>{`
        @keyframes scroll-pulse {
          0%   { transform: scale(1);    opacity: 0.8; }
          100% { transform: scale(1.9);  opacity: 0;   }
        }
      `}</style>
    </button>
  );
}
