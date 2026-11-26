import { describe, expect, it } from 'vitest';
import { ProductionOrderLineObjectValue } from './production-order-line-object-value.ts';

describe('ProductionOrderLineObjectValue', () => {
  const values = {
    requiredQuantity: 130,
    completedQuantity: 30,
    unitTimeSeconds: 40,
    setupTimeSeconds: 60,
  };

  it('calculates balance and includes setup in production time', () => {
    const result = ProductionOrderLineObjectValue.create(values);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.balance).toBe(100);
      expect(result.value.productionTimeSeconds).toBe(5260);
    }
  });

  it.each([
    { completedQuantity: 131 },
    { requiredQuantity: 1.5 },
    { completedQuantity: -1 },
    { setupTimeSeconds: -1 },
  ])('rejects invalid values: %o', (changes) => {
    expect(
      ProductionOrderLineObjectValue.create({ ...values, ...changes }).isLeft(),
    ).toBe(true);
  });
});
