"use client";

import { useOptimistic, useTransition } from "react";
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

export default function ReactionBar({ targetId, targetType, reactions, loggedIn }: Props) {
  const [optimistic, addOptimistic] = useOptimistic(
    toMap(reactions),
    (state: EmojiMap, emoji: string) => ({
      ...state,
      [emoji]: {
        count:       state[emoji].userReacted ? state[emoji].count - 1 : state[emoji].count + 1,
        userReacted: !state[emoji].userReacted,
      },
    }),
  );

  const [, startTransition] = useTransition();

  function handle(emoji: string) {
    if (!loggedIn) {
      window.dispatchEvent(new CustomEvent("open-login"));
      return;
    }
    startTransition(async () => {
      addOptimistic(emoji);
      await toggleReactionAction(targetId, targetType, emoji);
    });
  }

  const displayed = EMOJIS.filter((e) => optimistic[e].count > 0);

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
        const { count, userReacted } = optimistic[emoji];
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

      <div className="relative group">
        <button type="button"
          className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-border-site text-faint hover:border-[#c8a32e]/30 hover:text-muted text-xs transition-all">
          {displayed.length ? "+" : <><span>+</span><span>Réagir</span></>}
        </button>
        <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex z-10">
          {picker}
        </div>
      </div>
    </div>
  );
}
