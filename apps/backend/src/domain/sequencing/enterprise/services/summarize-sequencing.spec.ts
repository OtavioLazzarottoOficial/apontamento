import { describe, expect, it } from 'vitest';
import { SequencingLineObjectValue } from '../value-objects/sequencing-line-object-value.ts';
import { summarizeSequencing } from './summarize-sequencing.ts';

describe('sequencing summaries', () => {
  it('sums confirmed quantities and setup time by delivery date and batch', () => {
    const first = SequencingLineObjectValue.create({
      deliveryDate: '25/11/2026',
      schedule: '01/11/2026',
      batch: '10',
      lengthMm: '1000',
      widthMm: '500',
      requiredQuantity: 10,
      completedQuantity: 4,
      unitTimeSeconds: 30,
      setupTimeSeconds: 20,
    });
    const second = SequencingLineObjectValue.create({
      deliveryDate: '25/11/2026',
      schedule: '01/11/2026',
      batch: '11',
      lengthMm: '500',
      widthMm: '500',
      requiredQuantity: 2,
      completedQuantity: 1,
      unitTimeSeconds: 10,
      setupTimeSeconds: 5,
    });
    expect(first.isRight() && second.isRight()).toBe(true);
    if (first.isLeft() || second.isLeft()) throw new Error('Invalid fixture');
    expect(first.value.areaInHundredths).toBe(500);
    const result = summarizeSequencing([first.value, second.value]);
    expect(result.byDate['25/11/2026']).toEqual({
      requiredQuantity: 12,
      completedQuantity: 5,
      balance: 7,
      productionTimeSeconds: 345,
    });
    expect(result.byBatch['01/11/2026|10'].balance).toBe(6);
    expect(result.byBatch['01/11/2026|11'].balance).toBe(1);
    expect(result.total).toEqual(result.byDate['25/11/2026']);
  });
  it('rejects invalid values before a line can enter a summary', () => {
    expect(
      SequencingLineObjectValue.create({
        deliveryDate: '25/11/2026',
        schedule: '01/11/2026',
        batch: '10',
        lengthMm: 'bad',
        widthMm: '500',
        requiredQuantity: 1,
        completedQuantity: 0,
        unitTimeSeconds: 1,
        setupTimeSeconds: 0,
      }).isLeft(),
    ).toBe(true);
  });
});
