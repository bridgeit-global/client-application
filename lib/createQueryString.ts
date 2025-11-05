'use client';

/**
 * Utility function to create a query string by updating the given parameters.
 *
 * @param searchParams - Existing URLSearchParams or a string representing the current query.
 * @param params - An object where keys are the query parameter names and values are the new values to set.
 * @returns A string representing the updated query string.
 */
export function createQueryString(
  searchParams: URLSearchParams | string,
  params: Record<string, string | object | null | undefined | number>
): string {
  const newSearchParams = new URLSearchParams(searchParams.toString());

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      newSearchParams.delete(key);
    } else {
      newSearchParams.set(
        key,
        typeof value === 'object' ? JSON.stringify(removeNullValues(value)) : String(value)
      );
    }
  }

  return newSearchParams.toString();
}

function removeNullValues(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null)
  );
}
