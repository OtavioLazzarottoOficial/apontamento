import type { Machine, ReportSummary } from "./sequencing-shared.ts";
import { belongsToProductionWeek } from "./production-week.ts";

export function summarizeDailyAreas(
  machines: Machine[],
  documents: ReportSummary[],
  activeDate: string,
  selected: Record<string, string>,
  week?: string,
) {
  const groups = machines.map((machine) => {
    const options = documents.filter(
      (report) =>
        report.machineId === machine.id &&
        report.dailyAreas.some((line) =>
          week
            ? belongsToProductionWeek(line.date, week)
            : line.date === activeDate,
        ),
    );
    const chosen =
      options.length === 1
        ? options[0]
        : options.find(
            (report) =>
              report.id === selected[`${week ?? activeDate}:${machine.id}`],
          );
    const area =
      (activeDate
        ? chosen?.dailyAreas.find((line) => line.date === activeDate)?.area
        : 0) ?? 0;
    const reportArea =
      chosen?.dailyAreas.reduce((sum, line) => sum + line.area, 0) ?? 0;
    const weekArea =
      chosen?.dailyAreas.reduce(
        (sum, line) =>
          sum +
          (week && belongsToProductionWeek(line.date, week) ? line.area : 0),
        0,
      ) ?? 0;
    return { machine, options, chosen, area, reportArea, weekArea };
  });
  const unresolved = groups.filter(
    (group) => group.options.length > 1 && !group.chosen,
  ).length;
  const missing = groups.filter(
    (group) =>
      group.options.length === 0 ||
      (week &&
        group.chosen &&
        !group.chosen.dailyAreas.some(
          (line) => line.date === activeDate && !!activeDate,
        )),
  ).length;
  const incomplete = unresolved > 0 || missing > 0 || machines.length === 0;
  const total = groups.reduce((sum, group) => sum + group.area, 0);
  const missingWeekly = groups.filter(
    (group) => group.options.length === 0,
  ).length;
  const weeklyIncomplete =
    unresolved > 0 || missingWeekly > 0 || machines.length === 0;
  const weeklyTotal = groups.reduce((sum, group) => sum + group.weekArea, 0);
  return {
    groups,
    unresolved,
    missing,
    incomplete,
    total,
    missingWeekly,
    weeklyIncomplete,
    weeklyTotal,
  };
}
