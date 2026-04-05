import { decode } from 'html-entities';

/**
 * Decodes HTML entities in stored blog HTML. Content may be entity-encoded when
 * pasted into the rich-text editor (e.g. &lt;h3&gt; showing as literal tags).
 * Applies up to two decode passes for double-encoded content.
 */
export function decodeBlogHtml(html: string): string {
  if (!html) return '';
  let out = html;
  for (let i = 0; i < 2; i++) {
    const next = decode(out);
    if (next === out) break;
    out = next;
  }
  return out;
}
