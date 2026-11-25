import { summarizeDailyAreas } from "./summarize-daily-areas.ts";
import { useMemo, useState } from "react";
import type { Machine, ReportSummary } from "./sequencing-shared.ts";

export function MachinesDashboard({
  machines,
  reports,
  onOpen,
  canEdit,
  busy,
  onUnlink,
  onImport,
}: {
  machines: Machine[];
  reports: ReportSummary[];
  onOpen: (id: string) => void;
  canEdit: boolean;
  busy: boolean;
  onUnlink: (report: ReportSummary) => void;
  onImport: (machineId: string) => void;
}) {
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const dates = useMemo(
    () =>
      [
        ...new Set(
          reports
            .flatMap((report) => report.dailyAreas.map((line) => line.date))
            .filter(Boolean),
        ),
      ].sort((a, b) =>
        a
          .split("/")
          .reverse()
          .join("")
          .localeCompare(b.split("/").reverse().join("")),
      ),
    [reports],
  );
  const months = [
    ...new Set(
      dates
        .filter((item) => /^\d{2}\/\d{2}\/\d{4}$/.test(item))
        .map((item) => `${item.slice(6)}-${item.slice(3, 5)}`),
    ),
  ].sort();
  const activeMonth = months.includes(month) ? month : (months[0] ?? "");
  const datesInMonth = dates.filter(
    (item) => `${item.slice(6)}-${item.slice(3, 5)}` === activeMonth,
  );
  const activeDate = datesInMonth.includes(date)
    ? date
    : (datesInMonth[0] ?? "");
  const { groups, unresolved, missing, incomplete, total } =
    summarizeDailyAreas(machines, reports, activeDate, selected);
  const format = (value: number) =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return (
    <section className="machine-page">
      <p className="eyebrow">PRODUÇÃO</p>
      <h1>Visão geral</h1>
      <p>Área planejada por máquina e data de entrega.</p>
      <>
        {dates.length > 0 ? (
          <div className="dashboard-filters">
            <label>
              Mês
              <select
                value={activeMonth}
                onChange={(event) => {
                  setMonth(event.target.value);
                  setDate("");
                }}
              >
                {months.map((item) => (
                  <option key={item} value={item}>
                    {new Date(
                      Number(item.slice(0, 4)),
                      Number(item.slice(5)) - 1,
                    ).toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </label>
            <label className="dashboard-date">
              Data
              <select
                value={activeDate}
                onChange={(event) => setDate(event.target.value)}
              >
                {datesInMonth.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <p>Não há datas nos sequenciamentos importados.</p>
        )}
        <div className="dashboard-total">
          <span>
            {incomplete
              ? "Área selecionada até agora"
              : "Área total planejada do setor"}
          </span>
          <strong>{format(total)} m²</strong>
          <small>
            Inclui as ordens concluídas; soma a área das máquinas com
            sequenciamento selecionado.
          </small>
        </div>
        {unresolved > 0 && (
          <p role="alert">
            Selecione um sequenciamento para cada máquina com mais de uma opção
            para completar o total.
          </p>
        )}
        {missing > 0 && (
          <p role="status">
            Há máquinas sem sequenciamento para esta data; o total está
            incompleto.
          </p>
        )}
        <div className="dashboard-grid">
          {groups.map(({ machine, options, chosen, area }) => (
            <article className="tool-card" key={machine.id}>
              <h2>{machine.name}</h2>
              {canEdit && (
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => onImport(machine.id)}
                >
                  Vincular PDF
                </button>
              )}
              {options.length > 1 && (
                <label>
                  Sequenciamento
                  <select
                    value={chosen?.id ?? ""}
                    onChange={(event) =>
                      setSelected((current) => ({
                        ...current,
                        [`${activeDate}:${machine.id}`]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione um relatório</option>
                    {options.map((report) => (
                      <option key={report.id} value={report.id}>
                        {report.nome || report.id}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!options.length ? (
                <p>Sem sequenciamento para a data.</p>
              ) : chosen ? (
                <>
                  <p className="dashboard-report-name">
                    PDF: {chosen.nome || "Relatório sem nome"}
                  </p>
                  <strong className="machine-area">{format(area)} m²</strong>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onOpen(chosen.id)}
                  >
                    Abrir sequenciamento
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy}
                      onClick={() => onUnlink(chosen)}
                    >
                      Desvincular PDF da máquina
                    </button>
                  )}
                </>
              ) : (
                <p>Aguardando seleção.</p>
              )}
            </article>
          ))}
        </div>
        {machines.length === 0 && <p>Nenhuma máquina cadastrada.</p>}
      </>
    </section>
  );
}
