import {
  pdfFilenameFromHtmlUrl,
  prepareHtmlForPrint,
  receiptIdFromHtml,
  receiptPrintFilename
} from './html-to-pdf';

describe('pdfFilenameFromHtmlUrl', () => {
  it('replaces an html extension with pdf', () => {
    expect(pdfFilenameFromHtmlUrl('https://cdn.example.com/receipt.html')).toBe(
      'receipt.pdf'
    );
  });

  it('strips query strings from presigned urls', () => {
    expect(
      pdfFilenameFromHtmlUrl(
        'https://cdn.example.com/payment-receipt/abc.html?X-Amz-Expires=3600'
      )
    ).toBe('abc.pdf');
  });

  it('falls back when the path has no file name', () => {
    expect(pdfFilenameFromHtmlUrl('https://cdn.example.com/')).toBe(
      'document.pdf'
    );
  });
});

describe('prepareHtmlForPrint', () => {
  it('sets the document title and injects print helpers', () => {
    const html = '<html><head></head><body><h1>Receipt</h1></body></html>';
    const prepared = prepareHtmlForPrint(html, 'DHBVN receipt');

    expect(prepared).toContain('<title>DHBVN receipt</title>');
    expect(prepared).toContain('print-color-adjust: exact');
    expect(prepared).toContain('window.print()');
    expect(prepared).toContain('</body>');
  });

  it('escapes title content', () => {
    const prepared = prepareHtmlForPrint(
      '<html><head></head><body></body></html>',
      'A <script>alert(1)</script>'
    );

    expect(prepared).toContain(
      '<title>A &lt;script&gt;alert(1)&lt;/script&gt;</title>'
    );
    expect(prepared).not.toContain('<title>A <script>alert(1)</script></title>');
  });
});

describe('receiptIdFromHtml', () => {
  it('reads a DHBVN reference number from markup', () => {
    const html =
      '<td>REFERENCE NO</td><td>145226107</td><td>TRANSACTION NO</td><td>147327391</td>';
    expect(receiptIdFromHtml(html)).toBe('145226107');
  });

  it('reads a receipt id label', () => {
    expect(receiptIdFromHtml('<p>Receipt ID: ABCD-123456</p>')).toBe(
      'ABCD-123456'
    );
  });

  it('returns null when no receipt id is present', () => {
    expect(receiptIdFromHtml('<p>Bill receipt</p>')).toBeNull();
  });
});

describe('receiptPrintFilename', () => {
  it('prefers the receipt id from html', () => {
    expect(
      receiptPrintFilename(
        '<div>REFERENCE NO 145226107</div>',
        'https://cdn.example.com/other.html'
      )
    ).toBe('145226107.pdf');
  });

  it('falls back to the html url when no receipt id exists', () => {
    expect(
      receiptPrintFilename('<div>Receipt</div>', 'https://cdn.example.com/other.html')
    ).toBe('other.pdf');
  });
});
