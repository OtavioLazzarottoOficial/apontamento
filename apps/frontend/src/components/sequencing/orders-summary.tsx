import type { ReportLine } from "./sequencing-shared.ts";
import { formatDuration } from "./sequencing-shared.ts";

export function OrdersSummary({
  lines,
  search: searchTerm,
  onSearch,
}: {
  lines: ReportLine[];
  search: string;
  onSearch: (value: string) => void;
}) {
  const term = searchTerm.trim().toLocaleLowerCase("pt-BR");
  const filtered = lines.filter((line) =>
    [line.ordem, line.lote, line.dataEntrega, line.programacao].some((valor) =>
      String(valor ?? "")
        .toLocaleLowerCase("pt-BR")
        .includes(term),
    ),
  );
  return (
    <section className="report-section">
      <div className="section-heading">
        <div>
          <h3>Ordens de produção</h3>
          <p>Consulte as quantidades e os prazos identificados no PDF.</p>
        </div>
        <label className="report-search">
          Buscar ordem, lote ou entrega
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Ex.: número da OP"
          />
        </label>
      </div>
      <div className="table-scroll">
        <table className="report-table">
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Entrega</th>
              <th>Lote</th>
              <th>Programação</th>
              <th>Necessária</th>
              <th>Realizada</th>
              <th>Saldo</th>
              <th>Produção</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((line, index) => (
              <tr key={index}>
                <th scope="row">{line.ordem || "—"}</th>
                <td>{line.dataEntrega || "—"}</td>
                <td>{line.lote || "—"}</td>
                <td>{line.programacao || "—"}</td>
                <td>{line.necessaria.toLocaleString("pt-BR")}</td>
                <td>{line.realizada.toLocaleString("pt-BR")}</td>
                <td>{line.saldo.toLocaleString("pt-BR")}</td>
                <td>{formatDuration(line.tempoProducaoSegundos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="table-empty">
            {lines.length
              ? "Nenhuma ordem encontrada para esta busca."
              : "Nenhuma ordem identificada neste relatório."}
          </p>
        )}
      </div>
    </section>
  );
}
