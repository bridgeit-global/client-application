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

  it('repairs malformed nested href for Electricity Act style links', () => {
    const malformed =
      '<p>Law: &lt;a href="<a target="_blank" href="https://www.indiacode.nic.in/handle/123456789/2058">https://www.indiacode.nic.in/handle/123456789/2058</a>" rel="noopener"&gt;Electricity Act of 2003&lt;/a&gt;</p>';

    expect(decodeBlogHtml(malformed)).toBe(
      '<p>Law: <a href="https://www.indiacode.nic.in/handle/123456789/2058" rel="noopener">Electricity Act of 2003</a></p>'
    );
  });

  it('repairs malformed nested href for CERC style links and keeps target attrs', () => {
    const malformed =
      '&lt;a href="<a target="_blank" href="https://cercind.gov.in/">https://cercind.gov.in/</a>" rel="noopener" target="_blank"&gt;Central Electricity Regulatory Commission (CERC)&lt;/a&gt;';

    expect(decodeBlogHtml(malformed)).toBe(
      '<a href="https://cercind.gov.in/" rel="noopener" target="_blank">Central Electricity Regulatory Commission (CERC)</a>'
    );
  });
});
