export type VariantAttributes = Record<string, unknown>;

export function buildVariantOptionKeyFromAttributes(attributes: unknown, sku?: string): string {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
    const fallbackSku = typeof sku === 'string' ? sku.trim() : '';
    return fallbackSku ? `sku=${fallbackSku}` : 'default';
  }

  const entries = Object.entries(attributes as VariantAttributes)
    .filter(([key, value]) => {
      if (!key || key.trim() === '') return false;
      if (value === null || value === undefined) return false;
      const str = String(value).trim();
      return str.length > 0;
    })
    .map(([key, value]) => [key.trim(), String(value).trim()] as const);

  if (entries.length === 0) {
    const fallbackSku = typeof sku === 'string' ? sku.trim() : '';
    return fallbackSku ? `sku=${fallbackSku}` : 'default';
  }

  // Stable canonicalization for dedup.
  entries.sort(([a], [b]) => a.localeCompare(b));

  return entries.map(([key, value]) => `${key}=${value}`).join('|');
}
