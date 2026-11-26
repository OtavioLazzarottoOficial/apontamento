import type { SequencingLineObjectValue } from '../value-objects/sequencing-line-object-value.ts';

export interface SequencingSummary {
  requiredQuantity: number;
  completedQuantity: number;
  balance: number;
  productionTimeSeconds: number;
}

export function summarizeSequencing(
  lines: readonly SequencingLineObjectValue[],
) {
  const byDate: Record<string, SequencingSummary> = {};
  const byBatch: Record<string, SequencingSummary> = {};
  const empty = (): SequencingSummary => ({
    requiredQuantity: 0,
    completedQuantity: 0,
    balance: 0,
    productionTimeSeconds: 0,
  });
  const total = empty();

  for (const line of lines) {
    const date = (byDate[line.deliveryDate] ??= empty());
    const batch = (byBatch[`${line.schedule}|${line.batch}`] ??= empty());
    for (const summary of [date, batch, total]) {
      summary.requiredQuantity += line.requiredQuantity;
      summary.completedQuantity += line.completedQuantity;
      summary.balance += line.balance;
      summary.productionTimeSeconds += line.productionTimeSeconds;
    }
  }
  return { byDate, byBatch, total };
}
