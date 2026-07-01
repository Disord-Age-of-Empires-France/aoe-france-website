"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; description?: string };
export type SelectGroup  = { group: string; items: SelectOption[] };
export type SelectItem   = SelectOption | SelectGroup;

function isGroup(item: SelectItem): item is SelectGroup {
  return "group" in item;
}

function findOption(options: SelectItem[], value: string): SelectOption | undefined {
  for (const item of options) {
    if (isGroup(item)) {
      const found = item.items.find((o) => o.value === value);
      if (found) return found;
    } else if (item.value === value) {
      return item;
    }
  }
  return undefined;
}

interface Props {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectItem[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  name, value, onChange, options, placeholder = "Choisir…", disabled, className,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function select(v: string) {
    onChange(v);
    setOpen(false);
  }

  const selected = findOption(options, value);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 bg-background border border-border-site hover:border-[#c8a32e]/50 focus:outline-none focus:border-[#c8a32e] rounded px-4 py-3 text-sm transition-colors disabled:opacity-60 text-left"
      >
        <span className={selected ? "text-foreground" : "text-faint"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-faint transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface border border-border-site shadow-xl rounded overflow-hidden max-h-72 overflow-y-auto">
          {options.map((item, i) =>
            isGroup(item) ? (
              <div key={i}>
                <div className="px-4 py-2 text-[10px] font-bold tracking-widest text-faint uppercase bg-surface-2/60 border-b border-border-site/60">
                  {item.group}
                </div>
                {item.items.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => select(opt.value)}
                    className={`w-full text-left flex items-center justify-between px-6 py-2.5 text-[13px] font-medium transition-colors ${
                      value === opt.value
                        ? "text-[#c8a32e] bg-surface-2"
                        : "text-foreground/70 hover:text-[#c8a32e] hover:bg-surface-2"
                    }`}
                  >
                    {opt.label}
                    {value === opt.value && <Check size={12} className="shrink-0" />}
                  </button>
                ))}
              </div>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => select(item.value)}
                className={`w-full text-left flex items-center justify-between px-4 py-3 text-[13px] font-medium transition-colors ${
                  value === item.value
                    ? "text-[#c8a32e] bg-surface-2"
                    : "text-foreground/70 hover:text-[#c8a32e] hover:bg-surface-2"
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span>{item.label}</span>
                  {item.description && (
                    <span className="text-[11px] text-faint">{item.description}</span>
                  )}
                </div>
                {value === item.value && <Check size={12} className="shrink-0 text-[#c8a32e]" />}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
