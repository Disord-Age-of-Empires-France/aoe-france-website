import type { ReactNode } from "react";

function inlineFormat(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g);
  const out: ReactNode[] = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (!part) { i++; continue; }
    if (part.startsWith("**") && part.endsWith("**"))
      out.push(<strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>);
    else if (part.startsWith("*") && part.endsWith("*"))
      out.push(<em key={i} className="text-gray-300 italic">{part.slice(1, -1)}</em>);
    else if (part.startsWith("`") && part.endsWith("`"))
      out.push(<code key={i} className="bg-[#0a0f1e] text-[#c8a32e] px-1.5 py-0.5 rounded text-[0.85em] font-mono">{part.slice(1, -1)}</code>);
    else if (part.startsWith("[") && part.includes("](")) {
      const labelEnd = part.indexOf("](");
      const label = part.slice(1, labelEnd);
      const href  = part.slice(labelEnd + 2, -1);
      out.push(<a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-[#c8a32e] underline underline-offset-2 hover:text-[#e4bc4e]">{label}</a>);
    } else {
      out.push(part);
    }
    i++;
  }
  return out;
}

export function renderMarkdown(md: string): ReactNode {
  if (!md?.trim()) return <p className="text-gray-500 italic text-sm">Aucun contenu.</p>;

  const lines = md.split("\n");
  const out: ReactNode[] = [];
  let idx = 0;

  while (idx < lines.length) {
    const raw  = lines[idx];
    const line = raw.trim();

    if (!line) { idx++; continue; }

    // Horizontal rule
    if (/^---+$/.test(line)) {
      out.push(<hr key={idx} className="my-6 border-0 border-t border-[#1c2d47]" />);
      idx++; continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      idx++;
      while (idx < lines.length && !lines[idx].trim().startsWith("```")) {
        codeLines.push(lines[idx]);
        idx++;
      }
      idx++;
      out.push(
        <pre key={idx} className="my-5 bg-[#0a0f1e] border border-[#1c2d47] rounded-lg p-4 overflow-x-auto text-[0.82em] font-mono text-gray-300 leading-relaxed">
          {lang && <div className="text-[10px] text-faint mb-2 tracking-widest uppercase">{lang}</div>}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      out.push(<h3 key={idx} className="text-base font-bold text-white mt-7 mb-2 tracking-wide">{inlineFormat(line.slice(4))}</h3>);
      idx++; continue;
    }
    if (line.startsWith("## ")) {
      out.push(<h2 key={idx} className="text-lg font-bold text-white mt-9 mb-3 tracking-wide border-b border-[#1c2d47] pb-2">{inlineFormat(line.slice(3))}</h2>);
      idx++; continue;
    }
    if (line.startsWith("# ")) {
      out.push(<h1 key={idx} className="text-xl font-bold text-white mt-9 mb-3 tracking-wide">{inlineFormat(line.slice(2))}</h1>);
      idx++; continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (idx < lines.length && /^[-*] /.test(lines[idx].trim())) {
        items.push(lines[idx].trim().slice(2));
        idx++;
      }
      out.push(
        <ul key={idx} className="my-3 ml-5 space-y-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-gray-300 text-sm leading-relaxed">
              <span className="text-[#c8a32e] mt-[5px] shrink-0 text-[9px]">▸</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (idx < lines.length && /^\d+\. /.test(lines[idx].trim())) {
        items.push(lines[idx].trim().replace(/^\d+\. /, ""));
        idx++;
      }
      out.push(
        <ol key={idx} className="my-3 ml-5 space-y-2 list-decimal">
          {items.map((item, j) => (
            <li key={j} className="text-gray-300 text-sm leading-relaxed ml-4">
              {inlineFormat(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const items: string[] = [];
      while (idx < lines.length && lines[idx].trim().startsWith("> ")) {
        items.push(lines[idx].trim().slice(2));
        idx++;
      }
      out.push(
        <blockquote key={idx} className="my-5 border-l-2 border-[#c8a32e] pl-4 py-1 space-y-1">
          {items.map((item, j) => (
            <p key={j} className="text-gray-400 italic text-sm leading-relaxed">{inlineFormat(item)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      idx < lines.length &&
      lines[idx].trim() &&
      !/^#{1,3} /.test(lines[idx].trim()) &&
      !/^[-*] /.test(lines[idx].trim()) &&
      !/^\d+\. /.test(lines[idx].trim()) &&
      !lines[idx].trim().startsWith("> ") &&
      !lines[idx].trim().startsWith("```") &&
      !/^---+$/.test(lines[idx].trim())
    ) {
      paraLines.push(lines[idx].trim());
      idx++;
    }
    out.push(
      <p key={idx} className="text-gray-300 text-sm leading-[1.8] my-4">
        {inlineFormat(paraLines.join(" "))}
      </p>
    );
  }

  return out;
}
