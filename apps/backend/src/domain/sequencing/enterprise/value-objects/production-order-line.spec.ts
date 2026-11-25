import { describe, expect, it } from 'vitest';
import { ProductionOrderLine } from './production-order-line.ts';

describe('ProductionOrderLine', () => {
  const values = {
    requiredQuantity: 130,
    completedQuantity: 30,
    unitTimeSeconds: 40,
    setupTimeSeconds: 60,
  };

  it('calculates balance and includes setup in production time', () => {
    const result = ProductionOrderLine.create(values);
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
    expect(ProductionOrderLine.create({ ...values, ...changes }).isLeft()).toBe(
      true,
    );
  });
});
