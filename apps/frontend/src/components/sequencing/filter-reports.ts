import type { ReportSummary } from "./sequencing-shared.ts";
export const reportMonth = (date: string) =>
  /^\d{2}\/\d{2}\/\d{4}$/.test(date)
    ? `${date.slice(6)}-${date.slice(3, 5)}`
    : "";
export const compareReportDates = (a: string, b: string) =>
  a
    .split("/")
    .reverse()
    .join("")
    .localeCompare(b.split("/").reverse().join(""));
export function filterReports(
  reports: ReportSummary[],
  filters: { machine: string; month: string; date: string; query: string },
) {
  const query = filters.query.trim().toLocaleLowerCase("pt-BR");
  return reports
    .filter(
      (report) =>
        (!filters.machine ||
          (filters.machine === "unassigned"
            ? !report.machineId
            : report.machineId === filters.machine)) &&
        (!filters.month ||
          report.dailyAreas.some(
            (item) => reportMonth(item.date) === filters.month,
          )) &&
        (!filters.date ||
          report.dailyAreas.some((item) => item.date === filters.date)) &&
        (!query || report.nome.toLocaleLowerCase("pt-BR").includes(query)),
    )
    .sort((a, b) => {
      const latest = (report: ReportSummary) =>
        report.dailyAreas
          .map((item) => item.date)
          .sort(compareReportDates)
          .at(-1) ?? "";
      return (
        compareReportDates(latest(b), latest(a)) ||
        a.nome.localeCompare(b.nome, "pt-BR")
      );
    });
}
