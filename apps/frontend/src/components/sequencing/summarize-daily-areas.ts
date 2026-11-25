import type { Machine, ReportSummary } from "./sequencing-shared.ts";

export function summarizeDailyAreas(
  machines: Machine[],
  documents: ReportSummary[],
  activeDate: string,
  selected: Record<string, string>,
) {
  const groups = machines.map((machine) => {
    const options = documents.filter(
      (report) =>
        report.machineId === machine.id &&
        report.dailyAreas.some((line) => line.date === activeDate),
    );
    const chosen =
      options.length === 1
        ? options[0]
        : options.find(
            (report) => report.id === selected[`${activeDate}:${machine.id}`],
          );
    const area =
      chosen?.dailyAreas.find((line) => line.date === activeDate)?.area ?? 0;
    return { machine, options, chosen, area };
  });
  const unresolved = groups.filter(
    (group) => group.options.length > 1 && !group.chosen,
  ).length;
  const missing = groups.filter((group) => group.options.length === 0).length;
  const incomplete = unresolved > 0 || missing > 0 || machines.length === 0;
  const total = groups.reduce((sum, group) => sum + group.area, 0);
  return { groups, unresolved, missing, incomplete, total };
}
