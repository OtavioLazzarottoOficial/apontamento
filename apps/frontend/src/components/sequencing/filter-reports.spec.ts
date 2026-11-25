import { describe, expect, it } from "vitest";
import { filterReports } from "./filter-reports.ts";
import type { ReportSummary } from "./sequencing-shared.ts";
const reports: ReportSummary[] = [
  {
    id: "1",
    nome: "Novembro",
    versao: 1,
    machineId: "a",
    dailyAreas: [
      { date: "30/11/2026", area: 3 },
      { date: "01/12/2026", area: 2 },
    ],
  },
  {
    id: "2",
    nome: "Dezembro",
    versao: 1,
    machineId: "b",
    dailyAreas: [{ date: "10/12/2026", area: 4 }],
  },
  { id: "3", nome: "Antigo", versao: 1, machineId: null, dailyAreas: [] },
];
describe("report filters", () => {
  it("combines machine, month and day across reports spanning months", () => {
    expect(
      filterReports(reports, {
        machine: "a",
        month: "2026-12",
        date: "01/12/2026",
        query: "nov",
      }).map((item) => item.id),
    ).toEqual(["1"]);
    expect(
      filterReports(reports, {
        machine: "a",
        month: "2026-12",
        date: "10/12/2026",
        query: "",
      }),
    ).toEqual([]);
  });
  it("retains reports without a machine and orders the most recent first", () => {
    expect(
      filterReports(reports, {
        machine: "",
        month: "",
        date: "",
        query: "",
      }).map((item) => item.id),
    ).toEqual(["2", "1", "3"]);
    expect(
      filterReports(reports, {
        machine: "unassigned",
        month: "",
        date: "",
        query: "",
      }).map((item) => item.id),
    ).toEqual(["3"]);
  });
});
