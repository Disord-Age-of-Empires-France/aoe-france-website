"use client";

import { useRef, useState } from "react";
import {
  Bold, Code, Eye, Heading1, Heading2, Heading3,
  Italic, Link2, List, ListOrdered, Minus, Pencil, Quote, Terminal, BookOpen,
} from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";

const EXAMPLE_MD = `## Titre de section (H2)

Voici un paragraphe avec du texte en **gras**, en *italique* et du \`code inline\` au sein d'une phrase.

### Sous-titre (H3)

> Une citation ou un avertissement important peut être mis en valeur ainsi, sur une ou plusieurs lignes.

---

- Premier élément de liste
- Deuxième élément
- Troisième élément

1. Première étape
2. Deuxième étape
3. Troisième étape

\`\`\`
// Bloc de code — utile pour les commandes ou extraits
const joueur = "AoE France";
\`\`\`

[Texte du lien](https://example.com)`;

const SYNTAX_ROWS: { syntax: string; label: string }[] = [
  { syntax: "# Titre",          label: "Titre H1"           },
  { syntax: "## Titre",         label: "Titre H2"           },
  { syntax: "### Titre",        label: "Titre H3"           },
  { syntax: "**texte**",        label: "Gras"               },
  { syntax: "*texte*",          label: "Italique"           },
  { syntax: "`code`",           label: "Code inline"        },
  { syntax: "> texte",          label: "Citation"           },
  { syntax: "- élément",        label: "Liste à puces"      },
  { syntax: "1. élément",       label: "Liste numérotée"    },
  { syntax: "```\\ncode\\n```", label: "Bloc de code"       },
  { syntax: "[texte](url)",     label: "Lien"               },
  { syntax: "---",              label: "Séparateur"         },
];

interface Props {
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

type Btn = { icon: React.ElementType; title: string; fn: () => void };

export default function MarkdownEditor({ name, value, onChange, disabled }: Props) {
  const [mode, setMode] = useState<"edit" | "example" | "preview">("edit");
  const ref = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(before: string, after: string, placeholder = "texte") {
    const el = ref.current;
    if (!el) return;
    const s   = el.selectionStart;
    const e   = el.selectionEnd;
    const sel = value.slice(s, e) || placeholder;
    onChange(value.slice(0, s) + before + sel + after + value.slice(e));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    }, 0);
  }

  function linePrefix(prefix: string) {
    const el = ref.current;
    if (!el) return;
    const s         = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + prefix.length, s + prefix.length);
    }, 0);
  }

  function insertBlock(text: string, cursorOffset: number) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    onChange(value.slice(0, s) + text + value.slice(s));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + cursorOffset, s + cursorOffset);
    }, 0);
  }

  const GROUPS: Btn[][] = [
    [
      { icon: Heading1, title: "Titre H1 (# )", fn: () => linePrefix("# ")  },
      { icon: Heading2, title: "Titre H2 (## )", fn: () => linePrefix("## ") },
      { icon: Heading3, title: "Titre H3 (### )", fn: () => linePrefix("### ") },
    ],
    [
      { icon: Bold,   title: "Gras (**texte**)",       fn: () => wrapSelection("**", "**")        },
      { icon: Italic, title: "Italique (*texte*)",     fn: () => wrapSelection("*",  "*")         },
      { icon: Code,   title: "Code inline (`code`)",   fn: () => wrapSelection("`",  "`", "code") },
    ],
    [
      { icon: Quote,        title: "Citation (> )",         fn: () => linePrefix("> ")  },
      { icon: List,         title: "Liste (- )",             fn: () => linePrefix("- ") },
      { icon: ListOrdered,  title: "Liste numérotée (1. )", fn: () => linePrefix("1. ") },
    ],
    [
      { icon: Terminal, title: "Bloc de code (```)",  fn: () => insertBlock("```\n\n```\n", 4)  },
      { icon: Link2,    title: "Lien ([texte](url))", fn: () => wrapSelection("[", "](url)")    },
      { icon: Minus,    title: "Séparateur (---)",    fn: () => insertBlock("\n\n---\n\n", 6)   },
    ],
  ];

  return (
    <div>
      {/* Tab bar + toolbar */}
      <div className="flex items-stretch border border-border-site rounded-t bg-background">
        {/* Tabs */}
        <button
          type="button"
          onClick={() => setMode("edit")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors border-r border-border-site ${
            mode === "edit" ? "bg-surface text-foreground" : "text-faint hover:text-muted"
          }`}
        >
          <Pencil size={12} />Écrire

        </button>
        <button
          type="button"
          onClick={() => setMode("example")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors border-r border-border-site ${
            mode === "example" ? "bg-surface text-foreground" : "text-faint hover:text-muted"
          }`}
        >
          <BookOpen size={12} />Exemple
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold tracking-wider transition-colors ${
            mode === "preview" ? "bg-surface text-foreground" : "text-faint hover:text-muted"
          }`}
        >
          <Eye size={12} />Aperçu
        </button>

        {/* Toolbar — only in edit mode */}
        {mode === "edit" && (
          <div className="ml-auto flex items-stretch border-l border-border-site">
            {GROUPS.map((group, gi) => (
              <div
                key={gi}
                className={`flex items-stretch ${gi > 0 ? "border-l border-border-site/40" : ""}`}
              >
                {group.map(({ icon: Icon, title, fn }) => (
                  <button
                    key={title}
                    type="button"
                    title={title}
                    disabled={disabled}
                    onClick={fn}
                    className="px-2.5 flex items-center text-faint hover:text-[#c8a32e] hover:bg-surface-2 transition-colors disabled:opacity-40"
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit area */}
      {mode === "edit" ? (
        <textarea
          ref={ref}
          name={name}
          required
          rows={14}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-background border border-border-site border-t-0 focus:border-[#c8a32e] focus:outline-none rounded-b px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60 resize-y font-mono leading-relaxed"
          placeholder={"## Introduction\n\nRédigez votre article en Markdown…\n\n### Astuce\n\n**Gras**, *italique*, `code` — utilisez la barre d'outils ci-dessus."}
        />
      ) : mode === "example" ? (
        /* Example area */
        <div className="bg-background border border-border-site border-t-0 rounded-b overflow-hidden">
          {/* Syntax reference table */}
          <div className="border-b border-border-site">
            <div className="grid grid-cols-2 px-4 py-2 bg-surface-2/40 border-b border-border-site/60">
              <span className="text-[10px] font-bold tracking-widest text-faint uppercase">Syntaxe Markdown</span>
              <span className="text-[10px] font-bold tracking-widest text-faint uppercase">Description</span>
            </div>
            {SYNTAX_ROWS.map(({ syntax, label }) => (
              <div key={label} className="grid grid-cols-2 px-4 py-2 border-b border-border-site/30 hover:bg-surface-2/30 transition-colors">
                <code className="text-[12px] font-mono text-[#c8a32e]">{syntax}</code>
                <span className="text-[12px] text-muted">{label}</span>
              </div>
            ))}
          </div>

          {/* Full example — source left, preview right */}
          <div className="grid grid-cols-2 divide-x divide-border-site">
            <div>
              <div className="px-4 py-2 bg-surface-2/40 border-b border-border-site/60">
                <span className="text-[10px] font-bold tracking-widest text-faint uppercase">Markdown brut</span>
              </div>
              <pre className="px-4 py-4 text-[11.5px] font-mono text-faint leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {EXAMPLE_MD}
              </pre>
            </div>
            <div>
              <div className="px-4 py-2 bg-surface-2/40 border-b border-border-site/60">
                <span className="text-[10px] font-bold tracking-widest text-faint uppercase">Rendu final</span>
              </div>
              <div className="px-5 py-2 overflow-auto">
                {renderMarkdown(EXAMPLE_MD)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview area */
        <div className="min-h-[336px] bg-background border border-border-site border-t-0 rounded-b px-6 py-5 overflow-auto">
          {value.trim()
            ? renderMarkdown(value)
            : <p className="text-faint italic text-sm mt-2">Rien à prévisualiser — commencez à écrire.</p>
          }
        </div>
      )}
    </div>
  );
}
