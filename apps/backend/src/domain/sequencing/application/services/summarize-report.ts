import type { ReportSummary } from '../repositories/reports-repository.ts';

export interface ReportAreaLine {
  deliveryDate: string;
  area: number;
}

export function summarizeReport(
  id: string,
  version: number,
  name: string,
  machineId: string | null,
  lines: ReportAreaLine[],
): ReportSummary {
  const dailyAreas = new Map<string, number>();
  for (const line of lines) {
    dailyAreas.set(
      line.deliveryDate,
      (dailyAreas.get(line.deliveryDate) ?? 0) + line.area,
    );
  }
  return {
    id,
    version,
    name,
    machineId,
    dailyAreas: Array.from(dailyAreas, ([date, area]) => ({ date, area })),
  };
}
