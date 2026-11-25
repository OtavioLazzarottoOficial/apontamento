import type { ReportSummary } from '../repositories/reports-repository.ts';

export function summarizeReport(
  id: string,
  version: number,
  name: unknown,
  machineId: unknown,
  lines: unknown,
): ReportSummary {
  const dailyAreas = new Map<string, number>();
  if (Array.isArray(lines)) {
    for (const line of lines) {
      if (
        typeof line !== 'object' ||
        line === null ||
        typeof line.dataEntrega !== 'string' ||
        !line.dataEntrega ||
        typeof line.area !== 'number' ||
        !Number.isFinite(line.area)
      )
        continue;
      dailyAreas.set(
        line.dataEntrega,
        (dailyAreas.get(line.dataEntrega) ?? 0) + line.area,
      );
    }
  }
  return {
    id,
    versao: version,
    nome: typeof name === 'string' ? name : '',
    machineId: typeof machineId === 'string' ? machineId : null,
    dailyAreas: Array.from(dailyAreas, ([date, area]) => ({ date, area })),
  };
}
