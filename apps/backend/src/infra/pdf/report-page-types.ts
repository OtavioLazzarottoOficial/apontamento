export interface ReportPage {
  numero: number;
  largura: number;
  trechos: { texto: string; x: number; y: number }[];
}
export interface ReportSummary {
  necessaria: number;
  realizada: number;
  saldo: number;
  tempoProducaoSegundos: number;
}
export interface ReportSubtotalLine {
  dataEntrega: string;
  area: number;
  pendente: number;
  anterior: number;
  pecasPorCiclo: number;
  necessaria: number;
  realizada: number;
  saldo: number;
  tempoSetupSegundos: number;
  tempoUnitarioSegundos: number;
  tempoProducaoSegundos: number;
  campos: { necessaria: { pagina: number; indice: number } };
}
