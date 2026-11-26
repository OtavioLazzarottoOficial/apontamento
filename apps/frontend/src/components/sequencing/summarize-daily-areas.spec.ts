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
  it("sums selected machine reports across the week and tracks weekly completeness independently", () => {
    const docs = [
      report("a1", "a", [
        { dataEntrega: "23/11/2026", area: 10 },
        { dataEntrega: "24/11/2026", area: 20 },
      ]),
      report("a2", "a", [{ dataEntrega: "23/11/2026", area: 90 }]),
      report("b1", "b", [{ dataEntrega: "24/11/2026", area: 40 }]),
    ];
    expect(
      summarizeDailyAreas(machines, docs, "23/11/2026", {}, "2026-11-23"),
    ).toMatchObject({ weeklyTotal: 40, weeklyIncomplete: true, unresolved: 1 });
    expect(
      summarizeDailyAreas(
        machines,
        docs,
        "23/11/2026",
        { "2026-11-23:a": "a1" },
        "2026-11-23",
      ),
    ).toMatchObject({
      total: 10,
      incomplete: true,
      weeklyTotal: 70,
      weeklyIncomplete: false,
    });
    expect(
      summarizeDailyAreas(
        machines,
        docs.slice(0, 1),
        "23/11/2026",
        {},
        "2026-11-23",
      ),
    ).toMatchObject({
      weeklyTotal: 30,
      missingWeekly: 1,
      weeklyIncomplete: true,
    });
  });
  it("sums Monday to Friday only for the selected report and week", () => {
    const docs = [
      report("1", "a", [
        { dataEntrega: "20/11/2026", area: 50 },
        { dataEntrega: "23/11/2026", area: 10 },
        { dataEntrega: "27/11/2026", area: 20 },
        { dataEntrega: "28/11/2026", area: 100 },
        { dataEntrega: "30/11/2026", area: 200 },
      ]),
    ];
    expect(
      summarizeDailyAreas(machines, docs, "23/11/2026", {}, "2026-11-23"),
    ).toMatchObject({
      total: 10,
      groups: [{ area: 10, weekArea: 30 }, {}],
    });
  });
  it("sums the selected date across machines, without including other dates", () => {
    const docs = [
      report("1", "a", [
        { dataEntrega: "01/01/2026", area: 10 },
        { dataEntrega: "02/01/2026", area: 99 },
      ]),
      report("2", "b", [{ dataEntrega: "01/01/2026", area: 30 }]),
    ];
    expect(summarizeDailyAreas(machines, docs, "01/01/2026", {})).toMatchObject(
      {
        total: 40,
        incomplete: false,
        groups: [
          { area: 10, reportArea: 109 },
          { area: 30, reportArea: 30 },
        ],
      },
    );
  });
  it("requires a selection for overlapping reports and marks absent machines incomplete", () => {
    const docs = [
      report("1", "a", [{ dataEntrega: "01/01/2026", area: 10 }]),
      report("2", "a", [
        { dataEntrega: "01/01/2026", area: 20 },
        { dataEntrega: "02/01/2026", area: 5 },
      ]),
    ];
    expect(summarizeDailyAreas(machines, docs, "01/01/2026", {})).toMatchObject(
      { total: 0, unresolved: 1, missing: 1, incomplete: true },
    );
    expect(
      summarizeDailyAreas(machines, docs, "01/01/2026", {
        "01/01/2026:a": "2",
      }),
    ).toMatchObject({
      total: 20,
      unresolved: 0,
      missing: 1,
      incomplete: true,
      groups: [{ area: 20, reportArea: 25 }, {}],
    });
  });
});
