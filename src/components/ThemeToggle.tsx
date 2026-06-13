"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      className="flex items-center justify-center w-8 h-8 rounded text-muted hover:text-[#c8a32e] hover:bg-black/5 transition-colors"
      aria-label={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
