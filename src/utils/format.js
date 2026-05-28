/**
 * Format an AED amount for display.
 *
 * ≥ 1,000,000  → "AED 2.5M"
 * ≥ 1,000      → "AED 150K"
 * < 1,000      → "AED 500"
 * null / 0     → fallback (default "—")
 */
export const fmtAED = (value, fallback = '—') => {
  const n = Number(value);
  if (!value && value !== 0) return fallback;
  if (n === 0) return fallback;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `AED ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return `AED ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(/\.?0+$/, '')}K`;
  }
  return `AED ${n.toLocaleString()}`;
};

/**
 * Same as fmtAED but returns "AED 0" instead of "—" for zero values.
 * Useful for totals / summaries.
 */
export const fmtAEDOrZero = (value) => fmtAED(value, 'AED 0');
