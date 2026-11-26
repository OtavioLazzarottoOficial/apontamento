import { summarizeDailyAreas } from "./summarize-daily-areas.ts";
import { useMemo, useState } from "react";
import type { Machine, ReportSummary } from "./sequencing-shared.ts";
import {
  belongsToProductionWeek,
  currentProductionWeek,
  formatProductionWeek,
  productionWeeks,
} from "./production-week.ts";

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
  const [week, setWeek] = useState(currentProductionWeek);
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
  const weeks = productionWeeks(dates);
  const datesInWeek = dates.filter((item) =>
    belongsToProductionWeek(item, week),
  );
  const activeDate = datesInWeek.includes(date) ? date : (datesInWeek[0] ?? "");
  const {
    groups,
    unresolved,
    missing,
    incomplete,
    total,
    missingWeekly,
    weeklyIncomplete,
    weeklyTotal,
  } = summarizeDailyAreas(machines, reports, activeDate, selected, week);
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
        <div className="dashboard-filters">
          <label>
            Semana (segunda a sexta)
            <select
              value={week}
              onChange={(event) => {
                setWeek(event.target.value);
                setDate("");
              }}
            >
              {weeks.map((item) => (
                <option key={item} value={item}>
                  {formatProductionWeek(item)}
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
              {datesInWeek.length === 0 && (
                <option value="">Sem datas nesta semana</option>
              )}
              {datesInWeek.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="dashboard-total">
          <span>
            {incomplete
              ? "Área do dia selecionada até agora"
              : "Área total planejada do setor no dia"}
          </span>
          <strong>{format(total)} m²</strong>
          <span>
            {weeklyIncomplete
              ? "Área da semana selecionada até agora"
              : "Área total planejada do setor na semana"}
          </span>
          <strong>{format(weeklyTotal)} m²</strong>
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
            Há máquinas sem sequenciamento para a data selecionada; o total está
            incompleto.
          </p>
        )}
        {missingWeekly > 0 && (
          <p role="status">
            Há máquinas sem sequenciamento para a semana selecionada; o total
            semanal está incompleto.
          </p>
        )}
        <div className="dashboard-grid">
          {groups.map(({ machine, options, chosen, area, weekArea }) => (
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
                        [`${week}:${machine.id}`]: event.target.value,
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
                <p>Sem sequenciamento para a semana.</p>
              ) : chosen ? (
                <>
                  <p className="dashboard-report-name">
                    PDF: {chosen.nome || "Relatório sem nome"}
                  </p>
                  <p>
                    Área na data selecionada: <strong>{format(area)} m²</strong>
                  </p>
                  <p>
                    Área planejada na semana:{" "}
                    <strong className="machine-area">
                      {format(weekArea)} m²
                    </strong>
                  </p>
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
