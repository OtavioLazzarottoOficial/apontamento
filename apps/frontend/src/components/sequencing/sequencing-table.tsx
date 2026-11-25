import type {
  EditableField,
  FieldReference,
  ReportLine,
  ReportPage,
} from "./sequencing-shared.ts";
import { fieldLabels, formatDuration } from "./sequencing-shared.ts";

type IndexedLine = { linha: ReportLine; indice: number };
type NumericField =
  | "area"
  | "pendente"
  | "anterior"
  | "necessaria"
  | "realizada"
  | "saldo"
  | "pecasPorCiclo"
  | "tempoSetupSegundos"
  | "tempoUnitarioSegundos"
  | "tempoProducaoSegundos";

export function SequencingTable({
  date,
  lines,
  pages,
  editable,
  busy,
  onComplete,
  onSelect,
  onSelectText,
}: {
  date: string;
  lines: IndexedLine[];
  pages: ReportPage[];
  editable: boolean;
  busy: boolean;
  onComplete: (index: number, completed: boolean) => void;
  onSelect: (index: number, field: EditableField) => void;
  onSelectText: (reference: FieldReference, label: string) => void;
}) {
  const sum = (field: NumericField) =>
    lines.reduce((total, item) => total + item.linha[field], 0);
  const number = (value: number) =>
    value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const area = (value: number) =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const fragment = (ref: FieldReference) =>
    pages.find((page) => page.numero === ref.pagina)?.trechos[ref.indice];
  const editableText = (refs: FieldReference[], label: string) =>
    refs
      .filter((ref) => fragment(ref))
      .map((ref) =>
        editable ? (
          <button
            key={`${ref.pagina}-${ref.indice}`}
            type="button"
            className="mapa-campo"
            aria-label={`Editar ${label}`}
            onClick={() => onSelectText(ref, label)}
          >
            {fragment(ref)?.texto}{" "}
          </button>
        ) : (
          <span key={`${ref.pagina}-${ref.indice}`}>
            {fragment(ref)?.texto}{" "}
          </span>
        ),
      );
  const field = (
    value: string,
    index: number,
    name: EditableField,
    order: string,
  ) =>
    editable ? (
      <button
        type="button"
        className="mapa-campo"
        aria-label={`Editar ${fieldLabels[name]} da OP ${order}`}
        onClick={() => onSelect(index, name)}
      >
        {value}
      </button>
    ) : (
      value
    );
  const machineTitle = pages[0]?.trechos[0]?.texto;
  return (
    <section
      className="mapa-grupo"
      aria-label={`Ordens com entrega em ${date}`}
    >
      {machineTitle && <h4 className="mapa-machine-title">{machineTitle}</h4>}
      <h5>Data Entrega {date}</h5>
      <div className="mapa-rolagem">
        <table className="mapa-tabela">
          <thead>
            <tr>
              <th rowSpan={2} scope="col">
                Produto
              </th>
              <th rowSpan={2} scope="col">
                Prog - Lote
              </th>
              <th rowSpan={2} scope="col">
                OP
              </th>
              <th rowSpan={2} scope="col">
                Componente
              </th>
              <th rowSpan={2} scope="col">
                Dimensões
              </th>
              <th rowSpan={2} scope="col">
                m²
              </th>
              <th rowSpan={2} scope="col">
                Qtd. Pendente
              </th>
              <th rowSpan={2} scope="col">
                Atv. Anterior
              </th>
              <th colSpan={3} scope="colgroup">
                QNT
              </th>
              <th rowSpan={2} scope="col">
                PC / Ciclo
              </th>
              <th rowSpan={2} scope="col">
                T. Setup
              </th>
              <th rowSpan={2} scope="col">
                T. Para 1 PC
              </th>
              <th rowSpan={2} scope="col">
                T. Produção
              </th>
              <th rowSpan={2} scope="col">
                Situação
              </th>
            </tr>
            <tr>
              <th scope="col">Nec</th>
              <th scope="col">Rea</th>
              <th scope="col">Sal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(({ linha, indice }) => {
              const dimensions = linha.camposTexto.dimensoes
                .map((ref) => fragment(ref)?.texto ?? "")
                .join(" ")
                .trim();
              return (
                <tr
                  key={indice}
                  className={linha.concluida ? "mapa-concluida" : undefined}
                >
                  <td>
                    {editableText(
                      linha.camposTexto.produto,
                      `produto da OP ${linha.ordem}`,
                    )}
                  </td>
                  <td>
                    {linha.programacao}
                    <br />
                    {linha.lote}
                  </td>
                  <td>
                    {editableText(
                      linha.camposTexto.ordem,
                      `ordem de produção ${linha.ordem}`,
                    )}
                  </td>
                  <td>
                    {editableText(
                      linha.camposTexto.componente,
                      `componente da OP ${linha.ordem}`,
                    )}
                  </td>
                  <td>
                    {field(dimensions || "—", indice, "dimensoes", linha.ordem)}
                  </td>
                  <td>{area(linha.area)}</td>
                  <td>
                    {field(
                      number(linha.pendente),
                      indice,
                      "pendente",
                      linha.ordem,
                    )}
                  </td>
                  <td className="mapa-anterior">
                    {field(
                      number(linha.anterior),
                      indice,
                      "anterior",
                      linha.ordem,
                    )}
                  </td>
                  <td>
                    {field(
                      number(linha.necessaria),
                      indice,
                      "necessaria",
                      linha.ordem,
                    )}
                  </td>
                  <td>
                    {field(
                      number(linha.realizada),
                      indice,
                      "realizada",
                      linha.ordem,
                    )}
                  </td>
                  <td>{number(linha.saldo)}</td>
                  <td>
                    {field(
                      number(linha.pecasPorCiclo),
                      indice,
                      "pecasPorCiclo",
                      linha.ordem,
                    )}
                  </td>
                  <td>
                    {field(
                      formatDuration(linha.tempoSetupSegundos),
                      indice,
                      "tempoSetup",
                      linha.ordem,
                    )}
                  </td>
                  <td>
                    {field(
                      formatDuration(linha.tempoUnitarioSegundos),
                      indice,
                      "tempoUnitario",
                      linha.ordem,
                    )}
                  </td>
                  <td>{formatDuration(linha.tempoProducaoSegundos)}</td>
                  <td className="mapa-status">
                    {linha.concluida ? "Concluída" : "Em aberto"}
                    {editable && (
                      <button
                        type="button"
                        className="mapa-status-botao"
                        disabled={busy}
                        aria-label={`${linha.concluida ? "Reabrir" : "Concluir"} OP ${linha.ordem}`}
                        onClick={() => onComplete(indice, !linha.concluida)}
                      >
                        {linha.concluida ? "Reabrir" : "Concluir"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={5} scope="row">
                Total do dia
              </th>
              <td>{area(sum("area"))}</td>
              <td>{number(sum("pendente"))}</td>
              <td>{number(sum("anterior"))}</td>
              <td>{number(sum("necessaria"))}</td>
              <td>{number(sum("realizada"))}</td>
              <td>{number(sum("saldo"))}</td>
              <td>{number(sum("pecasPorCiclo"))}</td>
              <td>{formatDuration(sum("tempoSetupSegundos"))}</td>
              <td>{formatDuration(sum("tempoUnitarioSegundos"))}</td>
              <td>{formatDuration(sum("tempoProducaoSegundos"))}</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
