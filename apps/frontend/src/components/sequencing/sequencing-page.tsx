import { SequencingTable } from "./sequencing-table.tsx";
import type {
  ReportPage,
  ReportLine,
  FieldReference,
  EditableField,
} from "./sequencing-shared.ts";
import { formatDuration } from "./sequencing-shared.ts";
import { analyzeCapacity } from "../../lib/capacity.ts";

export function SequencingPage({
  eficiencia,
  paginas,
  linhas,
  paginaData,
  aoMudarPagina,
  editavel,
  ocupado,
  aoConcluir,
  aoSelecionar,
  aoSelecionarTexto,
}: {
  eficiencia: number | null;
  paginas: ReportPage[];
  linhas: ReportLine[];
  paginaData: number;
  aoMudarPagina: (indice: number) => void;
  editavel: boolean;
  ocupado: boolean;
  aoConcluir: (indice: number, concluida: boolean) => void;
  aoSelecionar: (indice: number, campo: EditableField) => void;
  aoSelecionarTexto: (referencia: FieldReference, rotulo: string) => void;
}) {
  const grupos = new Map<string, { linha: ReportLine; indice: number }[]>();
  linhas.forEach((linha, indice) => {
    const grupo = grupos.get(linha.dataEntrega) ?? [];
    grupo.push({ linha, indice });
    grupos.set(linha.dataEntrega, grupo);
  });
  const datas = Array.from(grupos.keys());
  const data = datas[paginaData];
  const grupo = grupos.get(data) ?? [];
  const capacidade =
    eficiencia === null
      ? null
      : analyzeCapacity(
          grupo.map(({ linha }) => linha),
          eficiencia,
        );
  const somar = (
    campo:
      | "necessaria"
      | "realizada"
      | "saldo"
      | "pendente"
      | "anterior"
      | "pecasPorCiclo"
      | "area"
      | "tempoProducaoSegundos",
  ) => grupo.reduce((total, item) => total + item.linha[campo], 0);
  const numero = (valor: number) =>
    valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return (
    <article className="mapa-pagina" aria-label="Mapa de sequenciamento">
      <div className="mapa-topo">
        <div>
          <h3>Mapa de sequenciamento</h3>
          <p>
            {paginas
              .flatMap((pagina) => pagina.trechos)
              .find((t) => /Referente ao período/i.test(t.texto))?.texto ?? ""}
          </p>
        </div>
      </div>
      {datas.length > 0 ? (
        <>
          <div className="mapa-paginacao">
            <button
              type="button"
              className="secondary"
              disabled={paginaData === 0}
              onClick={() => aoMudarPagina(paginaData - 1)}
            >
              ← Dia anterior
            </button>
            <div>
              <span>
                Dia {paginaData + 1} de {datas.length}
              </span>
              <strong>Entrega {data}</strong>
            </div>
            <button
              type="button"
              className="secondary"
              disabled={paginaData >= datas.length - 1}
              onClick={() => aoMudarPagina(paginaData + 1)}
            >
              Próximo dia →
            </button>
          </div>
          <div className="mapa-total" aria-label="Totais da data">
            <div>
              <span>Ordens</span>
              <strong>{grupo.length}</strong>
            </div>
            <div>
              <span>Peças necessárias</span>
              <strong>{numero(somar("necessaria"))}</strong>
            </div>
            <div>
              <span>Peças realizadas</span>
              <strong>{numero(somar("realizada"))}</strong>
            </div>
            <div>
              <span>Saldo de peças</span>
              <strong>{numero(somar("saldo"))}</strong>
            </div>
            <div>
              <span>Área total planejada</span>
              <strong>
                {somar("area").toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                m²
              </strong>
            </div>
            <div>
              <span>Tempo total de produção</span>
              <strong>{formatDuration(somar("tempoProducaoSegundos"))}</strong>
            </div>
          </div>
          {!capacidade && (
            <p role="alert">
              Não foi possível obter a eficiência global. A análise de
              capacidade está indisponível.
            </p>
          )}
          {capacidade && (
            <div
              className={`capacidade-resumo ${capacidade.excesso > 0 ? "capacidade-excedida" : "capacidade-disponivel"}`}
              role="status"
            >
              <strong>
                {capacidade.excesso > 0
                  ? "Capacidade excedida"
                  : "Dentro da capacidade planejada"}
              </strong>
              <p>
                Jornada: 08:48:00 · Eficiência: {eficiencia}% · Capacidade:{" "}
                {formatDuration(capacidade.capacidade)}
              </p>
              <p>
                Peças: {formatDuration(capacidade.tempoPecas)} + setup:{" "}
                {formatDuration(capacidade.tempoSetup)} = carga planejada:{" "}
                {formatDuration(capacidade.carga)}
                {capacidade.excesso > 0
                  ? ` · Excesso: ${formatDuration(capacidade.excesso)}`
                  : ""}
              </p>
              <small>
                Cálculo com quantidades necessárias de todas as ordens do dia,
                incluindo concluídas. A eficiência é global e se aplica também a
                relatórios existentes.
              </small>
            </div>
          )}
          <p className="mapa-instrucao">
            {editavel
              ? "Selecione um valor sublinhado para editar. Marcar uma ordem como concluída não altera os totais."
              : "Os totais incluem todas as ordens, inclusive as concluídas."}
          </p>
          <SequencingTable
            date={data}
            lines={grupo}
            pages={paginas}
            editable={editavel}
            busy={ocupado}
            onComplete={aoConcluir}
            onSelect={aoSelecionar}
            onSelectText={aoSelecionarTexto}
          />
        </>
      ) : (
        <p>Não há ordens reconhecidas neste relatório.</p>
      )}
    </article>
  );
}
