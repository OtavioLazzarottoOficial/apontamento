import { describe, expect, it } from "vitest";
import { summarizeDailyAreas } from "./summarize-daily-areas.ts";
import type { Machine, ReportSummary } from "./sequencing-shared.ts";
const machines: Machine[] = [
  { id: "a", name: "A", pdfTitle: "A" },
  { id: "b", name: "B", pdfTitle: "B" },
];
function report(
  id: string,
  machineId: string,
  lines: { dataEntrega: string; area: number }[],
): ReportSummary {
  return {
    id,
    versao: 1,
    nome: id,
    machineId,
    dailyAreas: lines.map((line) => ({
      date: line.dataEntrega,
      area: line.area,
    })),
  };
}
describe("daily planned area", () => {
  it("sums the selected date across machines, without including other dates", () => {
    const docs = [
      report("1", "a", [
        { dataEntrega: "01/01/2026", area: 10 },
        { dataEntrega: "02/01/2026", area: 99 },
      ]),
      report("2", "b", [{ dataEntrega: "01/01/2026", area: 30 }]),
    ];
    expect(summarizeDailyAreas(machines, docs, "01/01/2026", {})).toMatchObject(
      { total: 40, incomplete: false },
    );
  });
  it("requires a selection for overlapping reports and marks absent machines incomplete", () => {
    const docs = [
      report("1", "a", [{ dataEntrega: "01/01/2026", area: 10 }]),
      report("2", "a", [{ dataEntrega: "01/01/2026", area: 20 }]),
    ];
    expect(summarizeDailyAreas(machines, docs, "01/01/2026", {})).toMatchObject(
      { total: 0, unresolved: 1, missing: 1, incomplete: true },
    );
    expect(
      summarizeDailyAreas(machines, docs, "01/01/2026", {
        "01/01/2026:a": "2",
      }),
    ).toMatchObject({ total: 20, unresolved: 0, missing: 1, incomplete: true });
  });
});
