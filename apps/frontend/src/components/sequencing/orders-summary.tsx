import type { ReportLine } from "./sequencing-shared.ts";
import { formatDuration } from "./sequencing-shared.ts";

export function OrdersSummary({
  linhas,
  busca,
  aoBuscar,
}: {
  linhas: ReportLine[];
  busca: string;
  aoBuscar: (valor: string) => void;
}) {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const filtradas = linhas.filter((linha) =>
    [linha.ordem, linha.lote, linha.dataEntrega, linha.programacao].some(
      (valor) =>
        String(valor ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(termo),
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
            value={busca}
            onChange={(evento) => aoBuscar(evento.target.value)}
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
            {filtradas.map((linha, indice) => (
              <tr key={indice}>
                <th scope="row">{linha.ordem || "—"}</th>
                <td>{linha.dataEntrega || "—"}</td>
                <td>{linha.lote || "—"}</td>
                <td>{linha.programacao || "—"}</td>
                <td>{linha.necessaria.toLocaleString("pt-BR")}</td>
                <td>{linha.realizada.toLocaleString("pt-BR")}</td>
                <td>{linha.saldo.toLocaleString("pt-BR")}</td>
                <td>{formatDuration(linha.tempoProducaoSegundos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtradas.length === 0 && (
          <p className="table-empty">
            {linhas.length
              ? "Nenhuma ordem encontrada para esta busca."
              : "Nenhuma ordem identificada neste relatório."}
          </p>
        )}
      </div>
    </section>
  );
}
