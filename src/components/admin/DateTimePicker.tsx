"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function pad(n: number) { return String(n).padStart(2, "0"); }

function toUTCStr(y: number, mo: number, d: number, h: number, m: number) {
  return new Date(y, mo, d, h, m).toISOString();
}

function parseValue(value: string): { y: number; mo: number; d: number; h: number; m: number } | null {
  if (!value) return null;
  const dt = new Date(value);
  if (isNaN(dt.getTime())) return null;
  return { y: dt.getFullYear(), mo: dt.getMonth(), d: dt.getDate(), h: dt.getHours(), m: dt.getMinutes() };
}

interface SpinnerProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}

function TimeSpinner({ label, value, min, max, step = 1, onChange }: SpinnerProps) {
  function inc() { onChange(value + step > max ? min : value + step); }
  function dec() { onChange(value - step < min ? max - ((max - min + 1) % step || step) + step : value - step); }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-faint uppercase tracking-wider mb-0.5">{label}</span>
      <button
        type="button"
        onClick={inc}
        className="w-8 h-6 flex items-center justify-center text-faint hover:text-foreground hover:bg-surface-2 rounded transition-colors"
      >
        <ChevronUp size={14} />
      </button>
      <div className="text-2xl font-bold text-foreground w-10 text-center tabular-nums leading-none py-1">
        {pad(value)}
      </div>
      <button
        type="button"
        onClick={dec}
        className="w-8 h-6 flex items-center justify-center text-faint hover:text-foreground hover:bg-surface-2 rounded transition-colors"
      >
        <ChevronDown size={14} />
      </button>
    </div>
  );
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  minDate?: Date;
  disabled?: boolean;
}

export default function DateTimePicker({ value, onChange, minDate, disabled }: Props) {
  const parsed = parseValue(value);
  const now = new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.y ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.mo ?? now.getMonth());
  const [selDate, setSelDate] = useState<{ y: number; mo: number; d: number } | null>(
    parsed ? { y: parsed.y, mo: parsed.mo, d: parsed.d } : null
  );
  const [hours, setHours] = useState(parsed?.h ?? now.getHours());
  const [minutes, setMinutes] = useState(parsed ? Math.round(parsed.m / 5) * 5 % 60 : Math.round(now.getMinutes() / 5) * 5 % 60);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Sync external value changes
  useEffect(() => {
    const p = parseValue(value);
    if (p) {
      setSelDate({ y: p.y, mo: p.mo, d: p.d });
      setViewYear(p.y);
      setViewMonth(p.mo);
      setHours(p.h);
      setMinutes(p.m);
    } else {
      setSelDate(null);
    }
  }, [value]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function isDisabled(day: number): boolean {
    if (!minDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    const minDay = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return d < minDay;
  }

  function isSelected(day: number): boolean {
    return !!selDate && selDate.y === viewYear && selDate.mo === viewMonth && selDate.d === day;
  }

  function isToday(day: number): boolean {
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
  }

  function selectDay(day: number) {
    if (isDisabled(day)) return;
    const newSel = { y: viewYear, mo: viewMonth, d: day };
    setSelDate(newSel);
    onChange(toUTCStr(viewYear, viewMonth, day, hours, minutes));
  }

  function updateHours(h: number) {
    setHours(h);
    if (selDate) onChange(toUTCStr(selDate.y, selDate.mo, selDate.d, h, minutes));
  }

  function updateMinutes(m: number) {
    setMinutes(m);
    if (selDate) onChange(toUTCStr(selDate.y, selDate.mo, selDate.d, hours, m));
  }

  // Build calendar grid (week starts Monday)
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const displayStr = selDate
    ? new Date(selDate.y, selDate.mo, selDate.d).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      }) + ` à ${pad(hours)}h${pad(minutes)}`
    : "Choisir une date…";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 bg-background border border-border-site hover:border-[#c8a32e]/60 focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-sm transition-colors disabled:opacity-60 text-left"
      >
        <CalendarDays size={15} className="text-faint shrink-0" />
        <span className={selDate ? "text-foreground" : "text-faint"}>{displayStr}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-surface border border-border-site rounded-xl shadow-2xl p-4 w-72">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center text-faint hover:text-foreground hover:bg-surface-2 rounded transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTHS_FR[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center text-faint hover:text-foreground hover:bg-surface-2 rounded transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map((d) => (
              <div key={d} className="text-[10px] text-faint text-center font-semibold tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) =>
              day === null ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled(day)}
                  onClick={() => selectDay(day)}
                  className={`text-xs rounded-md py-1.5 font-medium transition-colors ${
                    isSelected(day)
                      ? "bg-[#c8a32e] text-[#080e1a] font-bold"
                      : isDisabled(day)
                      ? "text-faint/25 cursor-not-allowed"
                      : isToday(day)
                      ? "border border-[#c8a32e]/40 text-[#c8a32e] hover:bg-[#c8a32e]/10"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  {day}
                </button>
              )
            )}
          </div>

          {/* Time picker */}
          <div className="mt-4 pt-4 border-t border-border-site flex items-center justify-center gap-4">
            <TimeSpinner
              label="Heure"
              value={hours}
              min={0}
              max={23}
              step={1}
              onChange={updateHours}
            />
            <span className="text-2xl font-bold text-muted pb-1">:</span>
            <TimeSpinner
              label="Minutes"
              value={minutes}
              min={0}
              max={55}
              step={5}
              onChange={updateMinutes}
            />
          </div>

          {selDate && (
            <button
              type="button"
              onClick={() => { setOpen(false); }}
              className="mt-3 w-full py-2 bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-xs tracking-wider rounded transition-colors"
            >
              Confirmer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
