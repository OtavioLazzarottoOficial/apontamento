function parseDecimal(
  value: string,
): { integer: bigint; scale: bigint } | null {
  const parts = /^(\d+)(?:[.,](\d+))?$/.exec(value.trim());
  if (!parts) return null;
  const decimals = parts[2] ?? '';
  if (decimals.length > 8 || parts[1].length > 12) return null;
  return {
    integer: BigInt(parts[1] + decimals),
    scale: 10n ** BigInt(decimals.length),
  };
}

/** Comprimento e width em milímetros; result em centésimos de m². */
export function calculateAreaInHundredths(
  length: string,
  width: string,
  quantity: number,
): number | null {
  const c = parseDecimal(length);
  const l = parseDecimal(width);
  if (!c || !l || !Number.isSafeInteger(quantity) || quantity < 0) return null;
  const denominator = c.scale * l.scale * 10000n;
  const result =
    (c.integer * l.integer * BigInt(quantity) * 2n + denominator) /
    (2n * denominator);
  return result <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(result) : null;
}
