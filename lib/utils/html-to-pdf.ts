export function pdfFilenameFromHtmlUrl(htmlUrl: string): string {
  const raw = htmlUrl.split('/').pop() || 'document.html';
  const name = (raw.split('?')[0] || 'document.html').trim() || 'document.html';
  return name.replace(/\.html?$/i, '') + '.pdf';
}

export function sanitizePrintFilename(value: string): string {
  const cleaned = value.replace(/[\\/:*?"<>|]+/g, '-').trim();
  return cleaned || 'receipt';
}

export function receiptIdFromHtml(html: string): string | null {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ');

  const patterns = [
    /REFERENCE\s*NO\.?\s*[:\-]?\s*([A-Z0-9]{6,})/i,
    /RECEIPT\s*(?:ID|NO\.?|NUMBER)\s*[:\-]?\s*([A-Z0-9_-]{6,})/i,
    /TRANSACTION\s*NO\.?\s*[:\-]?\s*([A-Z0-9]{6,})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return sanitizePrintFilename(match[1]);
    }
  }

  return null;
}

export function receiptPrintFilename(html: string, htmlUrl: string): string {
  const receiptId = receiptIdFromHtml(html);
  if (receiptId) {
    return `${receiptId}.pdf`;
  }
  return pdfFilenameFromHtmlUrl(htmlUrl);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function injectBeforeTag(html: string, tag: RegExp, snippet: string): string | null {
  if (!tag.test(html)) return null;
  return html.replace(tag, `${snippet}$&`);
}

export function prepareHtmlForPrint(html: string, title: string): string {
  const safeTitle = escapeHtml(title);
  let next = html;

  if (/<title[\s>]/i.test(next)) {
    next = next.replace(
      /<title[^>]*>[\s\S]*?<\/title>/i,
      `<title>${safeTitle}</title>`
    );
  } else {
    next =
      injectBeforeTag(next, /<\/head>/i, `<title>${safeTitle}</title>`) ??
      `${next}<title>${safeTitle}</title>`;
  }

  const printStyle = `<style data-html-print="true">
    html, body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>`;
  next = injectBeforeTag(next, /<\/head>/i, printStyle) ?? `${next}${printStyle}`;

  const printScript = `<script>
    (function () {
      function runPrint() {
        try { window.print(); } catch (e) {}
      }
      function waitForAssets() {
        var images = Array.prototype.slice.call(document.images || []);
        Promise.all(images.map(function (img) {
          return img.complete ? Promise.resolve() : new Promise(function (resolve) {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
          });
        })).then(function () {
          setTimeout(runPrint, 150);
        });
      }
      if (document.readyState === 'complete') waitForAssets();
      else window.addEventListener('load', waitForAssets);
    })();
  </script>`;

  next =
    injectBeforeTag(next, /<\/body>/i, printScript) ??
    injectBeforeTag(next, /<\/html>/i, printScript) ??
    `${next}${printScript}`;

  return next;
}

/**
 * Prints HTML with the browser layout engine so Save as PDF keeps the original
 * receipt format. Uses a sandboxed iframe so receipt scripts cannot navigate or
 * crash the host app.
 */
export async function downloadHtmlAsPdf(
  html: string,
  filename: string
): Promise<void> {
  const title = sanitizePrintFilename(filename.replace(/\.pdf$/i, ''));
  const previousTitle = document.title;
  document.title = title;

  const restoreTitle = () => {
    document.title = previousTitle;
    window.removeEventListener('afterprint', restoreTitle);
  };
  window.addEventListener('afterprint', restoreTitle);
  window.setTimeout(restoreTitle, 60_000);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', title);
  // Unique origin: scripts can print, but cannot touch window.top / opener.
  iframe.setAttribute('sandbox', 'allow-scripts allow-modals');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10240px';
  iframe.style.top = '0';
  iframe.style.width = '1024px';
  iframe.style.height = '1440px';
  iframe.style.border = '0';

  const previous = document.querySelectorAll('iframe[data-html-print-frame="true"]');
  previous.forEach((node) => node.parentNode?.removeChild(node));

  iframe.dataset.htmlPrintFrame = 'true';

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      window.setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 60_000);
      if (error) {
        restoreTitle();
        reject(error);
      } else {
        resolve();
      }
    };

    iframe.addEventListener(
      'load',
      () => {
        window.setTimeout(() => finish(), 400);
      },
      { once: true }
    );

    try {
      iframe.srcdoc = prepareHtmlForPrint(html, title);
      document.body.appendChild(iframe);
    } catch (error) {
      finish(error);
      return;
    }

    window.setTimeout(() => {
      finish(new Error('Timed out preparing the receipt for print'));
    }, 15_000);
  });
}
