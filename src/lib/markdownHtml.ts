import { marked, type Renderer } from "marked";
import sanitizeHtml from "sanitize-html";

const renderer = {
  link({ href, text }: { href: string; text: string }) {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  },
} as Partial<Renderer>;

marked.use({ renderer, breaks: true, gfm: true });

const ALLOWED_TAGS = [
  ...sanitizeHtml.defaults.allowedTags,
  "del", "ins", "sup", "sub", "details", "summary",
];

function applyMentions(html: string): string {
  // Preserve code/pre blocks, only process plain text segments
  const parts = html.split(/(<(?:pre|code)[^>]*>[\s\S]*?<\/(?:pre|code)>)/);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part;
    return part.replace(/@([a-zA-Z0-9_-]{1,50})/g, (_, username) =>
      `<a href="/profil/${encodeURIComponent(username)}" class="mention">@${username}</a>`
    );
  }).join("");
}

export function renderMarkdown(content: string): string {
  const html = marked.parse(content) as string;
  const sanitized = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a:    ["href", "target", "rel", "class"],
      code: ["class"],
      pre:  ["class"],
      span: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
  return applyMentions(sanitized);
}
