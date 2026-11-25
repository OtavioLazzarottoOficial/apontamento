function decimalParaInteiro(
  valor: string,
): { inteiro: bigint; escala: bigint } | null {
  const partes = /^(\d+)(?:[.,](\d+))?$/.exec(valor.trim());
  if (!partes) return null;
  const decimais = partes[2] ?? '';
  if (decimais.length > 8 || partes[1].length > 12) return null;
  return {
    inteiro: BigInt(partes[1] + decimais),
    escala: 10n ** BigInt(decimais.length),
  };
}

/** Comprimento e largura em milímetros; resultado em centésimos de m². */
export function calculateAreaInHundredths(
  comprimento: string,
  largura: string,
  quantidade: number,
): number | null {
  const c = decimalParaInteiro(comprimento);
  const l = decimalParaInteiro(largura);
  if (!c || !l || !Number.isSafeInteger(quantidade) || quantidade < 0)
    return null;
  const denominador = c.escala * l.escala * 10000n;
  const resultado =
    (c.inteiro * l.inteiro * BigInt(quantidade) * 2n + denominador) /
    (2n * denominador);
  return resultado <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(resultado)
    : null;
}
