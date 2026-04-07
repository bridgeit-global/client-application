import { decode } from 'html-entities';

/**
 * Decodes HTML entities in stored blog HTML. Content may be entity-encoded when
 * pasted into the rich-text editor (e.g. &lt;h3&gt; showing as literal tags).
 * Applies up to two decode passes for double-encoded content.
 */
function normalizeMalformedAnchors(html: string): string {
  if (!html) return '';

  // Repairs malformed links in imported/editor content like:
  // <a href="<a ... href="https://x.com">https://x.com</a>" rel="noopener">Label</a>
  const malformedNestedHrefPattern =
    /<a\s+href=(["'])<a\b[^>]*?\bhref=(["'])([^"']+)\2[^>]*>.*?<\/a>\1([^>]*)>([\s\S]*?)<\/a>/gi;

  return html.replace(
    malformedNestedHrefPattern,
    (_match, _outerQuote, _innerQuote, href: string, trailingAttrs: string, text: string) => {
      const attrs = trailingAttrs?.trim() ? ` ${trailingAttrs.trim()}` : '';
      return `<a href="${href}"${attrs}>${text}</a>`;
    }
  );
}

export function decodeBlogHtml(html: string): string {
  if (!html) return '';
  let out = html;
  for (let i = 0; i < 2; i++) {
    const next = decode(out);
    if (next === out) break;
    out = next;
  }
  return normalizeMalformedAnchors(out);
}
