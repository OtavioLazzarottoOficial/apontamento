import { useState } from "react";
import { SequencingTable } from "./sequencing-table.tsx";
import type {
  ReportPage,
  ReportLine,
  FieldReference,
  EditableField,
} from "./sequencing-shared.ts";
import { formatDuration } from "./sequencing-shared.ts";
import { analyzeCapacity } from "../../lib/capacity.ts";
import {
  belongsToProductionWeek,
  currentProductionWeek,
  formatProductionWeek,
  parseProductionDate,
  productionWeeks,
} from "./production-week.ts";

export function SequencingPage({
  efficiency,
  pages,
  lines,
  dateIndex,
  onDateChange,
  editable,
  busy,
  onComplete,
  onSelect,
  onSelectText,
}: {
  efficiency: number | null;
  pages: ReportPage[];
  lines: ReportLine[];
  dateIndex: number;
  onDateChange: (index: number) => void;
  editable: boolean;
  busy: boolean;
  onComplete: (index: number, completed: boolean) => void;
  onSelect: (index: number, field: EditableField) => void;
  onSelectText: (reference: FieldReference, label: string) => void;
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [week, setWeek] = useState(currentProductionWeek);
  const [showEarlier, setShowEarlier] = useState(false);
  const groups = new Map<string, { line: ReportLine; index: number }[]>();
  lines.forEach((line, index) => {
    const group = groups.get(line.dataEntrega) ?? [];
    group.push({ line, index });
    groups.set(line.dataEntrega, group);
  });
  const allDates = Array.from(groups.keys());
  const dates = allDates
    .filter((date) => belongsToProductionWeek(date, week))
    .sort(
      (a, b) => (parseProductionDate(a) ?? 0) - (parseProductionDate(b) ?? 0),
    );
  const activeIndex = Math.min(dateIndex, Math.max(0, dates.length - 1));
  const data = dates[activeIndex];
  const group = groups.get(data) ?? [];
  const earlierDates = allDates
    .filter((date) => {
      const timestamp = parseProductionDate(date);
      return (
        timestamp !== null &&
        timestamp < Date.parse(`${week}T00:00:00Z`) &&
        (groups.get(date) ?? []).some(({ line }) => !line.concluida)
      );
    })
    .sort(
      (a, b) => (parseProductionDate(a) ?? 0) - (parseProductionDate(b) ?? 0),
    );
  const weekRemaining = lines.reduce(
    (total, line) =>
      total +
      (!line.concluida && belongsToProductionWeek(line.dataEntrega, week)
        ? line.tempoProducaoSegundos
        : 0),
    0,
  );
  const unclassified = lines.filter((line) => {
    const timestamp = parseProductionDate(line.dataEntrega);
    return (
      !line.concluida &&
      (timestamp === null || [0, 6].includes(new Date(timestamp).getUTCDay()))
    );
  }).length;
  const sequencingRemaining = lines.reduce(
    (total, line) => total + (line.concluida ? 0 : line.tempoProducaoSegundos),
    0,
  );
  const completedCount = group.filter(({ line }) => line.concluida).length;
  const remainingTime = group.reduce(
    (total, { line }) =>
      total + (line.concluida ? 0 : line.tempoProducaoSegundos),
    0,
  );
  const visibleLines = group.filter(({ line }) =>
    showCompleted ? line.concluida : !line.concluida,
  );
  const capacity =
    efficiency === null
      ? null
      : analyzeCapacity(
          group.map(({ line }) => line),
          efficiency,
        );
  const sum = (
    field:
      | "necessaria"
      | "realizada"
      | "saldo"
      | "pendente"
      | "anterior"
      | "pecasPorCiclo"
      | "area"
      | "tempoProducaoSegundos",
  ) => group.reduce((total, item) => total + item.line[field], 0);
  const number = (value: number) =>
    value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return (
    <article className="mapa-pagina" aria-label="Mapa de sequenciamento">
      <div className="mapa-topo">
        <div>
          <h3>Mapa de sequenciamento</h3>
          <p>
            {pages
              .flatMap((page) => page.trechos)
              .find((t) => /Referente ao período/i.test(t.texto))?.texto ?? ""}
          </p>
        </div>
      </div>
      <label>
        Semana (segunda a sexta){" "}
        <select
          value={week}
          onChange={(event) => {
            setWeek(event.target.value);
            onDateChange(0);
            setShowEarlier(false);
          }}
        >
          {productionWeeks(allDates).map((item) => (
            <option key={item} value={item}>
              {formatProductionWeek(item)}
            </option>
          ))}
        </select>
      </label>
      <p>
        Tempo restante na semana:{" "}
        <strong>{formatDuration(weekRemaining)}</strong>
      </p>
      {unclassified > 0 && (
        <p role="alert">
          Há {unclassified} ordem(ns) em aberto com data inválida ou de fim de
          semana, fora da programação semanal. Consulte o PDF original para
          conferência.
        </p>
      )}
      <button
        type="button"
        className="secondary"
        aria-expanded={showEarlier}
        onClick={() => setShowEarlier(!showEarlier)}
      >
        {showEarlier
          ? "Ocultar ordens pendentes anteriores"
          : `Ver ordens pendentes anteriores (${earlierDates.reduce((total, date) => total + (groups.get(date) ?? []).filter(({ line }) => !line.concluida).length, 0)})`}
      </button>
      {showEarlier &&
        (earlierDates.length ? (
          earlierDates.map((date) => {
            const earlierLines = (groups.get(date) ?? []).filter(
              ({ line }) => !line.concluida,
            );
            return (
              <SequencingTable
                key={date}
                date={date}
                lines={earlierLines}
                totalLines={earlierLines}
                pages={pages}
                editable={editable}
                busy={busy}
                onComplete={onComplete}
                onSelect={onSelect}
                onSelectText={onSelectText}
              />
            );
          })
        ) : (
          <p>Nenhuma ordem pendente anterior a esta semana.</p>
        ))}
      {dates.length > 0 ? (
        <>
          <div className="mapa-paginacao">
            <button
              type="button"
              className="secondary"
              disabled={activeIndex === 0}
              onClick={() => onDateChange(activeIndex - 1)}
            >
              ← Dia anterior
            </button>
            <div>
              <span>
                Dia {activeIndex + 1} de {dates.length}
              </span>
              <strong>Entrega {data}</strong>
            </div>
            <button
              type="button"
              className="secondary"
              disabled={activeIndex >= dates.length - 1}
              onClick={() => onDateChange(activeIndex + 1)}
            >
              Próximo dia →
            </button>
          </div>
          <div
            className="mapa-total"
            aria-label="Totais do sequenciamento e da data"
          >
            <div>
              <span>Ordens</span>
              <strong>{group.length}</strong>
            </div>
            <div>
              <span>Peças necessárias</span>
              <strong>{number(sum("necessaria"))}</strong>
            </div>
            <div>
              <span>Peças realizadas</span>
              <strong>{number(sum("realizada"))}</strong>
            </div>
            <div>
              <span>Saldo de peças</span>
              <strong>{number(sum("saldo"))}</strong>
            </div>
            <div>
              <span>Área total planejada</span>
              <strong>
                {sum("area").toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                m²
              </strong>
            </div>
            <div>
              <span>Tempo restante do dia</span>
              <strong>{formatDuration(remainingTime)}</strong>
            </div>
            <div>
              <span>Tempo restante de todo o sequenciamento</span>
              <strong>{formatDuration(sequencingRemaining)}</strong>
            </div>
            <div>
              <span>Tempo de produção planejado</span>
              <strong>{formatDuration(sum("tempoProducaoSegundos"))}</strong>
            </div>
          </div>
          {!capacity && (
            <p role="alert">
              Não foi possível obter a eficiência global. A análise de
              capacidade está indisponível.
            </p>
          )}
          {capacity && (
            <div
              className={`capacidade-resumo ${capacity.excesso > 0 ? "capacidade-excedida" : "capacidade-disponivel"}`}
              role="status"
            >
              <strong>
                {capacity.excesso > 0
                  ? "Capacidade excedida"
                  : "Dentro da capacidade planejada"}
              </strong>
              <p>
                Jornada: 08:48:00 · Eficiência: {efficiency}% · Capacidade:{" "}
                {formatDuration(capacity.capacidade)}
              </p>
              <p>
                Peças: {formatDuration(capacity.tempoPecas)} + setup:{" "}
                {formatDuration(capacity.tempoSetup)} = carga planejada:{" "}
                {formatDuration(capacity.carga)}
                {capacity.excesso > 0
                  ? ` · Excesso: ${formatDuration(capacity.excesso)}`
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
            {editable
              ? "Selecione um valor sublinhado para editar. O tempo restante considera as ordens em aberto; os totais planejados incluem também as concluídas."
              : "O tempo restante considera as ordens em aberto; os totais planejados incluem também as concluídas."}
          </p>
          <div className="mapa-instrucao" aria-label="Filtro de ordens">
            <button
              type="button"
              className="secondary"
              aria-pressed={showCompleted}
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted
                ? "Ver ordens em aberto"
                : `Ver concluídas (${completedCount})`}
            </button>
            {visibleLines.length === 0 && (
              <p role="status">
                {showCompleted
                  ? "Nenhuma ordem concluída nesta data."
                  : "Nenhuma ordem em aberto nesta data."}
              </p>
            )}
          </div>
          <SequencingTable
            date={data}
            lines={visibleLines}
            totalLines={group}
            pages={pages}
            editable={editable}
            busy={busy}
            onComplete={onComplete}
            onSelect={onSelect}
            onSelectText={onSelectText}
          />
        </>
      ) : (
        <>
          <p>Não há ordens nesta semana de segunda a sexta.</p>
          <p>
            Tempo restante de todo o sequenciamento:{" "}
            <strong>{formatDuration(sequencingRemaining)}</strong>
          </p>
        </>
      )}
    </article>
  );
}
