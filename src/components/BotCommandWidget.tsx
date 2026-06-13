"use client";

import { useState } from "react";
import Image from "next/image";
import type { BotCommand, BotCommandField } from "@/lib/db";

interface Props {
  commands: BotCommand[];
}

function groupFields(fields: BotCommandField[]): BotCommandField[][] {
  const rows: BotCommandField[][] = [];
  let group: BotCommandField[] = [];
  for (const f of fields) {
    if (!f.name && !f.value) continue;
    if (f.inline) {
      group.push(f);
      if (group.length === 3) { rows.push([...group]); group = []; }
    } else {
      if (group.length) { rows.push([...group]); group = []; }
      rows.push([f]);
    }
  }
  if (group.length) rows.push([...group]);
  return rows;
}

function DiscordEmbed({ cmd }: { cmd: BotCommand }) {
  const fieldRows = groupFields(cmd.previewFields);
  return (
    <div
      className="rounded overflow-hidden"
      style={{ backgroundColor: "#2b2d31", borderLeft: `4px solid ${cmd.previewColor}` }}
    >
      <div className="p-3 pr-4 space-y-2">
        {cmd.previewTitle && (
          <p className="text-white font-semibold text-sm leading-snug">{cmd.previewTitle}</p>
        )}
        {cmd.previewDescription && (
          <div className="text-[#dbdee1] text-xs leading-relaxed whitespace-pre-line">
            {cmd.previewDescription}
          </div>
        )}
        {fieldRows.length > 0 && (
          <div className="pt-1 space-y-1.5">
            {fieldRows.map((row, ri) => (
              <div
                key={ri}
                className={row.length > 1 ? "grid gap-2" : ""}
                style={row.length > 1 ? { gridTemplateColumns: `repeat(${row.length}, 1fr)` } : undefined}
              >
                {row.map((f, fi) => (
                  <div key={fi}>
                    <p className="text-[#dbdee1] text-[11px] font-bold mb-0.5">{f.name}</p>
                    <p className="text-[#b5bac1] text-xs leading-snug">{f.value}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {cmd.hasImage && (
          cmd.imageUrl ? (
            <Image
              src={cmd.imageUrl}
              alt="Aperçu"
              width={800}
              height={400}
              unoptimized
              className="mt-2 w-full rounded object-cover max-h-48"
            />
          ) : (
            <div className="mt-2 h-28 rounded bg-[#1e1f22] flex items-center justify-center border border-white/5">
              <span className="text-[#4f545c] text-xs">Image du patch</span>
            </div>
          )
        )}
        {cmd.previewFooter && (
          <p className="text-[#4f545c] text-[10px] pt-1 border-t border-white/5">{cmd.previewFooter}</p>
        )}
      </div>
    </div>
  );
}

export default function BotCommandWidget({ commands }: Props) {
  const [selected, setSelected] = useState<BotCommand | null>(commands[0] ?? null);
  const [phase, setPhase]       = useState<"idle" | "typing" | "shown">("shown");

  const categories = Array.from(new Set(commands.map(c => c.category)));

  function selectCommand(cmd: BotCommand) {
    if (cmd.id === selected?.id) return;
    setPhase("typing");
    setSelected(cmd);
    const t = setTimeout(() => setPhase("shown"), 1100);
    return () => clearTimeout(t);
  }

  if (commands.length === 0) return null;

  return (
    <div className="bg-[#313338] rounded-xl overflow-hidden border border-[#1c2d47] shadow-2xl">
      {/* Title bar */}
      <div className="bg-[#1e1f22] px-4 py-2.5 flex items-center gap-2 border-b border-black/20">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ed4245]/60" />
          <div className="w-3 h-3 rounded-full bg-[#faa81a]/60" />
          <div className="w-3 h-3 rounded-full bg-[#23a559]/60" />
        </div>
        <span className="text-[#4f545c] text-[11px] font-medium ml-2">Age of Empires - France — #bot-commandes</span>
      </div>

      <div className="flex min-h-[420px]">
        {/* Sidebar — channel list style */}
        <div className="w-[200px] shrink-0 bg-[#2b2d31] border-r border-black/20 flex flex-col">
          <div className="px-3 pt-4 pb-2">
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-[#080e1a]">
                <Image src="/logo.png" alt="Bot" width={28} height={28} style={{ mixBlendMode: "lighten" }} />
              </div>
              <div>
                <p className="text-white text-[11px] font-bold leading-none">Age of Empires - France</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] text-emerald-400">En ligne</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-2 pb-3 space-y-3 overflow-y-auto">
            {categories.map(cat => (
              <div key={cat}>
                <p className="px-2 text-[9px] font-bold tracking-[0.15em] text-[#80848e] uppercase mb-1">
                  {cat}
                </p>
                {commands.filter(c => c.category === cat).map(cmd => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => selectCommand(cmd)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors group ${
                      selected?.id === cmd.id
                        ? "bg-[#404249] text-white"
                        : "text-[#80848e] hover:text-[#dbdee1] hover:bg-white/5"
                    }`}
                  >
                    <span className="text-[13px]">/</span>
                    <span className="text-[13px] font-mono">{cmd.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Channel header */}
          <div className="px-4 py-2.5 border-b border-black/20 bg-[#313338] flex items-center gap-2">
            <span className="text-[#80848e] text-sm font-bold">#</span>
            <span className="text-white text-sm font-semibold">bot-commandes</span>
            {selected && (
              <>
                <div className="w-px h-4 bg-[#4f545c] mx-1" />
                <span className="text-[#80848e] text-xs">{selected.description}</span>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
            {selected && (
              <>
                {/* User message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">V</span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-white text-sm font-semibold">Vous</span>
                      <span className="text-[#4f545c] text-[10px]">Aujourd'hui</span>
                    </div>
                    <p className="text-[#dbdee1] text-sm font-mono">
                      {selected.usage || `/${selected.name}`}
                    </p>
                  </div>
                </div>

                {/* Bot response */}
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0 mt-0.5 w-8 h-8">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#080e1a]">
                      <Image src="/logo.png" alt="Bot" width={32} height={32} style={{ mixBlendMode: "lighten" }} />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#23a559] border-2 border-[#313338]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[#5865f2] text-sm font-semibold">Age of Empires - France</span>
                      <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 py-px rounded-sm">APP</span>
                      <span className="text-[#4f545c] text-[10px]">Aujourd'hui</span>
                    </div>

                    {phase === "typing" ? (
                      <div className="bg-[#2b2d31] rounded px-3 py-3 inline-flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full bg-[#80848e] animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="max-w-sm animate-in fade-in duration-300">
                        <DiscordEmbed cmd={selected} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Input bar (decorative) */}
          <div className="px-4 pb-4">
            <div className="bg-[#383a40] rounded-lg px-4 py-2.5 flex items-center gap-3">
              <span className="text-[#4f545c] text-xs flex-1">
                Essayez une commande dans la liste →
              </span>
              <span className="text-[#4f545c] text-xs">🔒</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
