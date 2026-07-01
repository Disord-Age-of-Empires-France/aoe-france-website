"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, Edit3, Bold, Italic, List, Code, Link as LinkIcon, Smile } from "lucide-react";

interface Props {
  name: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
  rows?: number;
}

const TOOLBAR = [
  { label: "Gras",    icon: Bold,     wrap: ["**", "**"],    sample: "texte" },
  { label: "Italique",icon: Italic,   wrap: ["*", "*"],      sample: "texte" },
  { label: "Code",    icon: Code,     wrap: ["`", "`"],      sample: "code"  },
  { label: "Lien",    icon: LinkIcon, wrap: ["[", "](url)"], sample: "texte" },
  { label: "Liste",   icon: List,     wrap: ["\n- ", ""],    sample: "élément" },
];

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "😀",
    emojis: ["😀","😁","😂","🤣","😃","😄","😅","😆","😊","😇","🥰","😍","😎","🤩","😏","😒","😞","😔","😟","😕","🙁","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤫","🤭","🫡","😑","😬","🙄","😯","😲","😴","🥱","😷","🤒","🤕","🤑","🤠"],
  },
  {
    label: "👍",
    emojis: ["👍","👎","👏","🙌","🤝","🤜","🤛","✊","👊","🫶","❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","💯","✅","❌","⚠️","🚫","💬","👀","🔥","⚡","💥","✨","🎉","🎊","🏆","🥇","🥈","🥉","🎯","💪","🤌","🫵","🤙","🤘","✌️","👌","🤞","🫰"],
  },
  {
    label: "⚔️",
    emojis: ["⚔️","🛡️","🏹","🗡️","🔱","⚜️","🏰","🏯","🗺️","🌍","🌊","🏔️","🌋","🐴","🐎","🦅","🦁","🐉","🐲","☠️","💀","👑","🪖","🎖️","🏴","⚙️","🔩","🪓","🪚","⛏️","🔨","🧱","🌾","🪵","🪨","🌿","🍎","🌽","🐑","🐄","🐖","🐓","🐟","🎣","🏡","⛪","🕌","⛩️"],
  },
  {
    label: "🎮",
    emojis: ["🎮","🕹️","👾","🎲","🃏","🀄","♟️","🎭","🎯","🏆","🥇","🎖️","🏅","🎗️","🎪","🎬","📺","💻","🖥️","⌨️","🖱️","📱","📡","🔭","🧪","🧬","🔬","💡","🔋","⚡","🌐","📶","🛰️","🤖","👽","🛸","🚀","🌙","⭐","🌟","💫","✨","☄️","🌈","🌀"],
  },
  {
    label: "🌿",
    emojis: ["🌿","🌱","🌲","🌳","🌴","🌵","🍀","🍁","🍂","🍃","🌺","🌸","🌼","🌻","🌹","🌷","🍄","🐾","🦋","🐝","🐛","🐞","🦎","🐍","🦊","🐺","🦝","🐻","🐼","🐨","🦁","🐯","🦅","🦆","🦉","🦜","🐬","🦈","🐳","🐠","🌅","🌄","⛰️","🏕️","🌌","🌠","🌙","☀️","🌤️","⛅","🌧️","⛈️","❄️"],
  },
  {
    label: "🍕",
    emojis: ["🍕","🍔","🌮","🌯","🍟","🌭","🥪","🥙","🧆","🥚","🍳","🥓","🥩","🍗","🍖","🦴","🍿","🧂","🥫","🍱","🍣","🍜","🍝","🍛","🍲","🥘","🫕","🥗","🍚","🍙","🍘","🍥","🍡","🧁","🎂","🍰","🍮","🍭","🍬","🍫","🍩","🍪","☕","🍵","🧋","🥤","🍺","🍻","🥂","🍷","🥃","🍸","🍹"],
  },
];

export default function ForumEditor({ name, placeholder, minLength, maxLength = 20000, defaultValue = "", rows = 8 }: Props) {
  const [value,      setValue]      = useState(defaultValue);
  const [activeTab,  setActiveTab]  = useState<"edit" | "preview">("edit");
  const [preview,    setPreview]    = useState("");
  const [emojiOpen,  setEmojiOpen]  = useState(false);
  const [emojiCat,   setEmojiCat]   = useState(0);

  const emojiRef  = useRef<HTMLDivElement>(null);
  const taRef     = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Close picker on outside click
  useEffect(() => {
    if (!emojiOpen) return;
    function handle(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [emojiOpen]);

  async function switchToPreview() {
    if (value.trim()) {
      const { marked }             = await import("marked");
      const { default: DOMPurify } = await import("dompurify");
      marked.use({ breaks: true, gfm: true });
      const html = marked.parse(value) as string;
      setPreview(DOMPurify.sanitize(html));
    } else {
      setPreview("");
    }
    setActiveTab("preview");
  }

  function getTextarea() {
    return document.querySelector<HTMLTextAreaElement>(`textarea[name="${name}"]`);
  }

  function insertWrap(before: string, after: string, sample: string) {
    const ta = getTextarea();
    if (!ta) return;
    const start    = ta.selectionStart;
    const end      = ta.selectionEnd;
    const selected = value.slice(start, end) || sample;
    const next     = value.slice(0, start) + before + selected + after + value.slice(end);
    setValue(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }

  function saveSelection() {
    const ta = getTextarea();
    if (ta) taRef.current = { start: ta.selectionStart, end: ta.selectionEnd };
  }

  function insertEmoji(emoji: string) {
    const { start, end } = taRef.current;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    setEmojiOpen(false);
    setTimeout(() => {
      const ta = getTextarea();
      if (!ta) return;
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  const pct = Math.min(100, Math.round((value.length / maxLength) * 100));

  return (
    <div className="border border-border-site rounded-lg overflow-visible bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-site bg-surface rounded-t-lg">
        <div className="flex items-center gap-1">
          {TOOLBAR.map(({ label, icon: Icon, wrap: [before, after], sample }) => (
            <button
              key={label}
              type="button"
              title={label}
              onClick={() => { setActiveTab("edit"); insertWrap(before, after, sample); }}
              className="w-7 h-7 flex items-center justify-center rounded text-faint hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <Icon size={13} />
            </button>
          ))}

          {/* Emoji picker trigger */}
          <div className="relative" ref={emojiRef}>
            <button
              type="button"
              title="Insérer un emoji"
              onClick={() => { setActiveTab("edit"); saveSelection(); setEmojiOpen(v => !v); }}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${emojiOpen ? "text-[#c8a32e] bg-[#c8a32e]/10" : "text-faint hover:text-foreground hover:bg-surface-2"}`}
            >
              <Smile size={13} />
            </button>

            {emojiOpen && (
              <div className="absolute left-0 top-9 z-50 w-72 bg-surface border border-border-site rounded-xl shadow-xl overflow-hidden">
                {/* Category tabs */}
                <div className="flex border-b border-border-site bg-surface-2/50">
                  {EMOJI_CATEGORIES.map((cat, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEmojiCat(i)}
                      className={`flex-1 py-2 text-base leading-none transition-colors ${emojiCat === i ? "bg-[#c8a32e]/10 border-b-2 border-[#c8a32e]" : "hover:bg-surface-2"}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                {/* Emoji grid */}
                <div className="grid grid-cols-8 gap-0 p-2 max-h-52 overflow-y-auto">
                  {EMOJI_CATEGORIES[emojiCat].emojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-surface-2 transition-colors leading-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 border border-border-site rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold transition-colors ${activeTab === "edit" ? "bg-[#c8a32e]/10 text-[#c8a32e]" : "text-faint hover:text-muted"}`}
          >
            <Edit3 size={11} />Écrire
          </button>
          <button
            type="button"
            onClick={switchToPreview}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold transition-colors ${activeTab === "preview" ? "bg-[#c8a32e]/10 text-[#c8a32e]" : "text-faint hover:text-muted"}`}
          >
            <Eye size={11} />Aperçu
          </button>
        </div>
      </div>

      {/* Editor — textarea stays in DOM (hidden in preview) so FormData always has the value */}
      <textarea
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
        onSelect={saveSelection}
        onClick={saveSelection}
        onKeyUp={saveSelection}
        placeholder={placeholder ?? "Écrivez votre message… (Markdown supporté)"}
        rows={rows}
        minLength={activeTab === "edit" ? minLength : undefined}
        className={`w-full px-4 py-3 bg-transparent text-foreground placeholder-faint text-sm resize-none focus:outline-none leading-relaxed font-mono${activeTab !== "edit" ? " hidden" : ""}`}
      />
      {activeTab === "preview" && (
        <div className="px-4 py-3 min-h-[120px]">
          {preview
            ? <div className="prose-forum text-sm text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: preview }} />
            : <p className="text-faint text-sm italic">Rien à prévisualiser.</p>
          }
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border-site bg-surface rounded-b-lg">
        <span className="text-[10px] text-faint">Markdown · Emoji supportés</span>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1 bg-surface-2 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-400" : "bg-[#c8a32e]"}`} style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-[10px] tabular-nums ${value.length > maxLength * 0.9 ? "text-amber-400" : "text-faint"}`}>
            {value.length}/{maxLength}
          </span>
        </div>
      </div>
    </div>
  );
}
