import { decodeBlogHtml } from './decode-blog-html';

describe('decodeBlogHtml', () => {
  it('returns empty string for empty input', () => {
    expect(decodeBlogHtml('')).toBe('');
  });

  it('leaves normal HTML unchanged', () => {
    const html = '<p>Hello</p><h2>Title</h2>';
    expect(decodeBlogHtml(html)).toBe(html);
  });

  it('decodes entity-encoded markup so it can render as elements', () => {
    const encoded = '<p>&lt;h3&gt;Section&lt;/h3&gt; text &lt;a href="https://x.com"&gt;link&lt;/a&gt;</p>';
    const decoded = decodeBlogHtml(encoded);
    expect(decoded).toBe(
      '<p><h3>Section</h3> text <a href="https://x.com">link</a></p>'
    );
  });

  it('applies a second pass for double-encoded content', () => {
    const double = '&amp;lt;p&amp;gt;Hi&amp;lt;/p&amp;gt;';
    expect(decodeBlogHtml(double)).toBe('<p>Hi</p>');
  });
});
