export const JORNADA_SEGUNDOS = 8 * 3600 + 48 * 60;

export function analisarCapacidade(linhas: { necessaria: number; tempoUnitarioSegundos: number; tempoSetupSegundos: number }[], eficienciaPercentual: number) {
  const tempoPecas = linhas.reduce((total, linha) => total + linha.necessaria * linha.tempoUnitarioSegundos, 0);
  const tempoSetup = linhas.reduce((total, linha) => total + linha.tempoSetupSegundos, 0);
  const capacidade = JORNADA_SEGUNDOS * eficienciaPercentual / 100;
  const carga = tempoPecas + tempoSetup;
  return { tempoPecas, tempoSetup, capacidade, carga, excesso: Math.max(0, carga - capacidade) };
}
