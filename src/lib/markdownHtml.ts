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

export function renderMarkdown(content: string): string {
  const html = marked.parse(content) as string;
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a:    ["href", "target", "rel"],
      code: ["class"],
      pre:  ["class"],
      span: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}
