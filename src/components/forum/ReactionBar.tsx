"use client";

import { useState, useTransition, useRef } from "react";
import { toggleReactionAction } from "@/app/actions/forum";
import type { ForumReaction } from "@/lib/db";

const EMOJIS = ["👍", "❤️", "😂", "🔥", "👀"] as const;

interface Props {
  targetId:   string;
  targetType: "topic" | "reply";
  reactions:  ForumReaction[];
  loggedIn:   boolean;
}

type EmojiMap = Record<string, { count: number; userReacted: boolean }>;

function toMap(reactions: ForumReaction[]): EmojiMap {
  const map: EmojiMap = {};
  for (const e of EMOJIS) map[e] = { count: 0, userReacted: false };
  for (const r of reactions) if (map[r.emoji] !== undefined) map[r.emoji] = { count: r.count, userReacted: r.userReacted };
  return map;
}

function toggle(map: EmojiMap, emoji: string): EmojiMap {
  return {
    ...map,
    [emoji]: {
      count:       map[emoji].userReacted ? map[emoji].count - 1 : map[emoji].count + 1,
      userReacted: !map[emoji].userReacted,
    },
  };
}

export default function ReactionBar({ targetId, targetType, reactions, loggedIn }: Props) {
  const [reactionMap, setReactionMap] = useState<EmojiMap>(() => toMap(reactions));
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  function openPicker()  {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPickerOpen(true);
  }
  function closePicker() {
    closeTimer.current = setTimeout(() => setPickerOpen(false), 400);
  }

  function handle(emoji: string) {
    if (!loggedIn) {
      window.dispatchEvent(new CustomEvent("open-login"));
      return;
    }
    // Mise à jour locale immédiate — persiste après la transition
    setReactionMap(prev => toggle(prev, emoji));

    startTransition(async () => {
      const result = await toggleReactionAction(targetId, targetType, emoji);
      if (result?.error) {
        // Annule en cas d'erreur serveur
        setReactionMap(prev => toggle(prev, emoji));
      }
    });
  }

  const displayed = EMOJIS.filter((e) => reactionMap[e].count > 0);

  const picker = (
    <div className="flex items-center gap-1 bg-surface-2 border border-border-site rounded-lg p-1.5 shadow-lg">
      {EMOJIS.map((emoji) => (
        <button key={emoji} type="button" onClick={() => handle(emoji)}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface text-base transition-colors">
          {emoji}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {displayed.map((emoji) => {
        const { count, userReacted } = reactionMap[emoji];
        return (
          <button key={emoji} type="button" onClick={() => handle(emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
              userReacted
                ? "bg-[#c8a32e]/15 border-[#c8a32e]/40 text-[#c8a32e] font-semibold"
                : "bg-surface border-border-site text-muted hover:border-[#c8a32e]/30"
            }`}>
            <span>{emoji}</span>
            <span className="tabular-nums">{count}</span>
          </button>
        );
      })}

      <div className="relative" onMouseEnter={openPicker} onMouseLeave={closePicker}>
        <button type="button" onClick={openPicker}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-border-site text-faint hover:border-[#c8a32e]/30 hover:text-muted text-xs transition-all">
          {displayed.length ? "+" : <><span>+</span><span>Réagir</span></>}
        </button>
        {pickerOpen && (
          <div className="absolute bottom-full left-0 mb-1 flex z-10">
            {picker}
          </div>
        )}
      </div>
    </div>
  );
}
