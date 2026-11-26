import { useState, type FormEvent } from "react";
import {
  request,
  type Machine,
  type Report,
  type ReportSummary,
} from "./sequencing-shared.ts";

type SpreadsheetRow = {
  row: number;
  batch: string;
  deadline: string | null;
  rawDeadline: string;
};
type Comparison = {
  batch: string;
  order: string;
  machine: string;
  date: string;
  deadline: string | null;
  state: "late" | "partial" | "unknown" | "ambiguous";
};

function isoDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(`${iso}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === iso
    ? iso
    : null;
}

export function SectorDeadlinePanel({
  token,
  reports,
  machines,
  canEdit,
}: {
  token: string;
  reports: ReportSummary[];
  machines: Machine[];
  canEdit: boolean;
}) {
  const [year, setYear] = useState("");
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [sheet, setSheet] = useState("");
  const [unrecognizedBatches, setUnrecognizedBatches] = useState<
    { row: number; value: string }[]
  >([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  async function importSpreadsheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setLoaded(false);
    setRows([]);
    setUnrecognizedBatches([]);
    setComparisons([]);
    try {
      const form = new FormData(event.currentTarget);
      const result = await request<{
        sheet: string;
        rows: SpreadsheetRow[];
        unrecognizedBatches: { row: number; value: string }[];
      }>("/prazos/planilha/preview", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const documents = await Promise.all(
        reports.map((report) =>
          request<Report>(`/relatorios/${encodeURIComponent(report.id)}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );
      const values: Comparison[] = [];
      for (const report of documents) {
        for (const line of report.conteudo.linhas) {
          const machine = machines.find(
            (item) => item.id === report.conteudo.machineId,
          );
          const matched = result.rows.filter((row) => row.batch === line.lote);
          const date = isoDate(line.dataEntrega);
          const deadline = matched.length === 1 ? matched[0].deadline : null;
          const state =
            matched.length > 1
              ? "ambiguous"
              : !deadline || !date || !machine
                ? "unknown"
                : date > deadline
                  ? "late"
                  : "partial";
          values.push({
            batch: line.lote,
            order: line.ordem,
            machine: machine?.name ?? "Máquina não identificada",
            date: line.dataEntrega,
            deadline,
            state,
          });
        }
      }
      setSheet(result.sheet);
      setRows(result.rows);
      setUnrecognizedBatches(result.unrecognizedBatches);
      setComparisons(values);
      setLoaded(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível comparar os prazos.",
      );
    } finally {
      setBusy(false);
    }
  }
  const labels = {
    late: "Possível atraso",
    partial: "Sem atraso identificado · avaliação incompleta",
    unknown: "Prazo, data ou máquina não identificados",
    ambiguous: "Prazo duplicado · conferir planilha",
  };
  return (
    <section className="tool-card">
      <h1>Prazos por setor</h1>
      <p>
        Compare a data de entrega dos sequenciamentos com a coluna Usi da
        planilha. Todas as máquinas atuais são consideradas da usinagem.
      </p>
      {canEdit ? (
        <form className="form-stack" onSubmit={importSpreadsheet}>
          <label>
            Planilha Excel (.xlsx)
            <input name="arquivo" type="file" accept=".xlsx" required />
          </label>
          <label>
            Ano para datas sem ano na planilha
            <input
              name="ano"
              type="number"
              min="1900"
              max="9999"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              required
            />
          </label>
          <button disabled={busy}>
            {busy ? "Analisando…" : "Analisar planilha"}
          </button>
        </form>
      ) : (
        <p>Um usuário com permissão de edição pode analisar a planilha.</p>
      )}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {loaded && (
        <>
          <h2>Resultado da análise</h2>
          <p>
            Planilha: {sheet}. Foram lidos {rows.length} lotes. A análise é
            temporária, inclui todos os relatórios cadastrados e não confirma
            que todas as peças ou máquinas foram consideradas.
          </p>
          <div className="table-scroll">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>OP</th>
                  <th>Máquina</th>
                  <th>Data do mapa</th>
                  <th>Prazo usinagem</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, index) => (
                  <tr key={index}>
                    <td>{item.batch}</td>
                    <td>{item.order}</td>
                    <td>{item.machine}</td>
                    <td>{item.date}</td>
                    <td>{item.deadline ?? "Não identificado"}</td>
                    <td>{labels[item.state]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unrecognizedBatches.length > 0 && (
            <details>
              <summary>
                Lotes não identificados: {unrecognizedBatches.length}
              </summary>
              <ul>
                {unrecognizedBatches.map((batch) => (
                  <li key={batch.row}>
                    Linha {batch.row}: {batch.value}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {comparisons.length === 0 && (
            <p>Nenhuma ordem cadastrada para comparar.</p>
          )}
          {rows.some((row) => !row.deadline) && (
            <details>
              <summary>Datas não reconhecidas ou sem prazo</summary>
              <ul>
                {rows
                  .filter((row) => !row.deadline)
                  .map((row) => (
                    <li key={row.row}>
                      Linha {row.row}, lote {row.batch}:{" "}
                      {row.rawDeadline || "vazio"}
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
