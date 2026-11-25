export const WORKDAY_SECONDS = 8 * 3600 + 48 * 60;

export function analyzeCapacity(
  linhas: {
    necessaria: number;
    tempoUnitarioSegundos: number;
    tempoSetupSegundos: number;
  }[],
  eficienciaPercentual: number,
) {
  const tempoPecas = linhas.reduce(
    (total, linha) => total + linha.necessaria * linha.tempoUnitarioSegundos,
    0,
  );
  const tempoSetup = linhas.reduce(
    (total, linha) => total + linha.tempoSetupSegundos,
    0,
  );
  const capacidade = (WORKDAY_SECONDS * eficienciaPercentual) / 100;
  const carga = tempoPecas + tempoSetup;
  return {
    tempoPecas,
    tempoSetup,
    capacidade,
    carga,
    excesso: Math.max(0, carga - capacidade),
  };
}
