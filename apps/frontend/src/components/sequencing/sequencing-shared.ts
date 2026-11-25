export type Report = {
  id: string;
  versao: number;
  conteudo: {
    nome: string;
    machineId?: string | null;
    paginas: ReportPage[];
    linhas: ReportLine[];
    resumos?: {
      total: {
        necessaria: number;
        realizada: number;
        saldo: number;
        tempoProducaoSegundos: number;
      };
    };
  };
};

export type ReportPage = {
  numero: number;
  largura: number;
  altura: number;
  trechos: {
    texto: string;
    x: number;
    y: number;
    largura: number;
    altura: number;
  }[];
};

export type ReportLine = {
  concluida?: boolean;
  ordem: string;
  dataEntrega: string;
  programacao: string;
  lote: string;
  area: number;
  pendente: number;
  anterior: number;
  pecasPorCiclo: number;
  necessaria: number;
  realizada: number;
  saldo: number;
  tempoUnitarioSegundos: number;
  tempoSetupSegundos: number;
  tempoProducaoSegundos: number;
  campos: {
    pendente: FieldReference;
    anterior: FieldReference;
    pecasPorCiclo: FieldReference;
    necessaria: FieldReference;
    realizada: FieldReference;
    tempoUnitario: FieldReference;
    tempoSetup: FieldReference;
  };
  camposTexto: {
    ordem: FieldReference[];
    produto: FieldReference[];
    componente: FieldReference[];
    dimensoes: FieldReference[];
  };
};

export type FieldReference = { pagina: number; indice: number };

export type EditableField =
  | "necessaria"
  | "realizada"
  | "tempoUnitario"
  | "tempoSetup"
  | "dimensoes"
  | "pendente"
  | "anterior"
  | "pecasPorCiclo";

export type UserProfile = {
  email: string;
  papel: "ADMINISTRADOR" | "USUARIO";
  podeEditar: boolean;
  podeExportar: boolean;
};

export type ReportSummary = {
  id: string;
  nome: string;
  versao: number;
  machineId: string | null;
  dailyAreas: { date: string; area: number }[];
};

export const base = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export async function request<T>(path: string, init: RequestInit): Promise<T> {
  const resposta = await fetch(`${base}${path}`, init);
  if (!resposta.ok) {
    const erro: unknown = await resposta.json().catch(() => null);
    const mensagem =
      typeof erro === "object" &&
      erro !== null &&
      "message" in erro &&
      typeof erro.message === "string"
        ? erro.message
        : `Erro de comunicação (${resposta.status}).`;
    throw new Error(mensagem);
  }
  if (resposta.status === 204) return undefined as T;
  return resposta.json() as Promise<T>;
}

export function formatDuration(total: number) {
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((valor) => String(valor).padStart(2, "0"))
    .join(":");
}

export function parseDuration(valor: FormDataEntryValue | null) {
  const partes = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(String(valor));
  if (!partes)
    throw new Error(
      "Informe os tempos no formato horas:minutos:segundos, por exemplo 00:01:30.",
    );
  return Number(partes[1]) * 3600 + Number(partes[2]) * 60 + Number(partes[3]);
}

export const fieldLabels: Record<EditableField, string> = {
  pendente: "Quantidade pendente",
  anterior: "Atividade anterior",
  pecasPorCiclo: "Peças por ciclo",
  necessaria: "Quantidade necessária",
  realizada: "Quantidade realizada",
  tempoUnitario: "Tempo por peça",
  tempoSetup: "Tempo de setup",
  dimensoes: "Dimensões",
};

export type Machine = { id: string; name: string; pdfTitle: string };
