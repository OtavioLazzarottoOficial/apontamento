import { makeSequencing } from '../../../../test/factories/make-sequencing.ts';
import { describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../../../core/entities/unique-entity-id.ts';
import { SequencingLineObjectValue } from './value-objects/sequencing-line-object-value.ts';

describe('Sequencing', () => {
  it('keeps its identity and protects its lines while summarizing the plan', () => {
    const result = SequencingLineObjectValue.create({
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
    if (result.isLeft()) throw new Error('Invalid test line');
    const lines = [result.value];
    const sequencing = makeSequencing(
      { lines },
      new UniqueEntityID('report-id'),
    );
    lines.length = 0;
    expect(sequencing.id.toString()).toBe('report-id');
    expect(sequencing.lines).toHaveLength(1);
    expect(sequencing.summarize().total).toEqual({
      requiredQuantity: 10,
      completedQuantity: 4,
      balance: 6,
      productionTimeSeconds: 320,
    });
  });
});
