import { describe, expect, it } from "vitest";
import {
  belongsToProductionWeek,
  currentProductionWeek,
  productionWeeks,
} from "./production-week.ts";

describe("production weeks", () => {
  it("uses Monday through Friday, including across year boundaries", () => {
    expect(currentProductionWeek(new Date(2027, 0, 1, 12))).toBe("2026-12-28");
    expect(belongsToProductionWeek("28/12/2026", "2026-12-28")).toBe(true);
    expect(belongsToProductionWeek("01/01/2027", "2026-12-28")).toBe(true);
    expect(belongsToProductionWeek("02/01/2027", "2026-12-28")).toBe(false);
    expect(belongsToProductionWeek("03/01/2027", "2026-12-28")).toBe(false);
    expect(belongsToProductionWeek("31/02/2027", "2026-12-28")).toBe(false);
  });

  it("offers the current week and weeks with valid weekdays", () => {
    expect(
      productionWeeks(
        ["24/11/2026", "28/11/2026", "01/12/2026", "inválida"],
        "2026-11-23",
      ),
    ).toEqual(["2026-11-30", "2026-11-23"]);
  });
});
