/** Resolve registration bill storage key from `connections.connection_details`. */
export function getDocumentKeyAndType(
  connectionDetails: unknown
): { key: string; contentType: 'pdf' | 'html' } | null {
  if (!connectionDetails || typeof connectionDetails !== 'object') return null;
  const details = connectionDetails as Record<string, unknown>;
  if (typeof details.pdf_key === 'string' && details.pdf_key) {
    return { key: details.pdf_key, contentType: 'pdf' };
  }
  if (typeof details.html_key === 'string' && details.html_key) {
    return { key: details.html_key, contentType: 'html' };
  }
  return null;
}
