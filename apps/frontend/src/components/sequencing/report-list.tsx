import {
  filterReports,
  reportMonth as dateKey,
  compareReportDates as sortDate,
} from "./filter-reports.ts";
import { useState } from "react";
import type { Machine, ReportSummary } from "./sequencing-shared.ts";

const pageSize = 10;
const monthLabel = (month: string) =>
  new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5)) - 1,
  ).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
export function ReportList({
  reports,
  machines,
  canEdit,
  busy,
  onOpen,
  onDelete,
}: {
  reports: ReportSummary[];
  machines: Machine[];
  canEdit: boolean;
  busy: boolean;
  onOpen: (id: string) => void;
  onDelete: (report: ReportSummary) => void;
}) {
  const [machine, setMachine] = useState("");
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const months = [
    ...new Set(
      reports
        .flatMap((report) =>
          report.dailyAreas.map((item) => dateKey(item.date)),
        )
        .filter(Boolean),
    ),
  ]
    .sort()
    .reverse();
  const dates = [
    ...new Set(
      reports
        .flatMap((report) => report.dailyAreas.map((item) => item.date))
        .filter((item) => dateKey(item) && (!month || dateKey(item) === month)),
    ),
  ]
    .sort(sortDate)
    .reverse();
  const filtered = filterReports(reports, { machine, month, date, query });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  return (
    <section className="tool-card" aria-label="Relatórios compartilhados">
      <div>
        <h2>Relatórios compartilhados</h2>
        <p>Filtre pela data de entrega das ordens e pela máquina.</p>
      </div>
      <div className="report-filters">
        <label>
          Buscar por nome
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Nome do relatório"
          />
        </label>
        <label>
          Máquina
          <select
            value={machine}
            onChange={(event) => {
              setMachine(event.target.value);
              setPage(0);
            }}
          >
            <option value="">Todas as máquinas</option>
            <option value="unassigned">Sem máquina vinculada</option>
            {machines.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mês de entrega
          <select
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
              setDate("");
              setPage(0);
            }}
          >
            <option value="">Todos os meses</option>
            {months.map((item) => (
              <option key={item} value={item}>
                {monthLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dia de entrega
          <select
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(0);
            }}
          >
            <option value="">Todos os dias</option>
            {dates.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="report-count">
        {filtered.length}{" "}
        {filtered.length === 1
          ? "relatório encontrado"
          : "relatórios encontrados"}
      </p>
      {filtered.length === 0 ? (
        <p>
          {reports.length
            ? "Nenhum relatório corresponde aos filtros."
            : "Nenhum relatório disponível."}
        </p>
      ) : (
        <ul className="report-list">
          {filtered
            .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
            .map((report) => {
              const dates = report.dailyAreas
                .map((item) => item.date)
                .sort(sortDate);
              const period = dates.length
                ? dates[0] === dates.at(-1)
                  ? dates[0]
                  : `${dates[0]} a ${dates.at(-1)}`
                : "Sem data identificada";
              return (
                <li key={report.id}>
                  <div className="report-list-info">
                    <button
                      className="report-link"
                      disabled={busy}
                      onClick={() => onOpen(report.id)}
                    >
                      {report.nome || "Relatório sem nome"}
                    </button>
                    <span>
                      {machines.find((item) => item.id === report.machineId)
                        ?.name ?? "Sem máquina vinculada"}{" "}
                      · Entrega: {period} · Versão {report.versao}
                    </span>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      className="delete-report-button"
                      disabled={busy}
                      onClick={() => onDelete(report)}
                    >
                      Remover
                    </button>
                  )}
                </li>
              );
            })}
        </ul>
      )}
      {pageCount > 1 && (
        <div className="report-pagination">
          <button
            type="button"
            className="secondary"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            Anterior
          </button>
          <span>
            Página {currentPage + 1} de {pageCount}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </section>
  );
}
