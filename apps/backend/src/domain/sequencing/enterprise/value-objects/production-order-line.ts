import { left, right, type Either } from '../../../../core/either.ts';
import { InvalidLineValuesError } from '../errors/invalid-line-values-error.ts';

export interface ProductionOrderLineValues {
  requiredQuantity: number;
  completedQuantity: number;
  unitTimeSeconds: number;
  setupTimeSeconds: number;
}

export class ProductionOrderLine {
  private constructor(private readonly values: ProductionOrderLineValues) {}

  get balance() {
    return this.values.requiredQuantity - this.values.completedQuantity;
  }

  get productionTimeSeconds() {
    return (
      this.values.requiredQuantity * this.values.unitTimeSeconds +
      this.values.setupTimeSeconds
    );
  }

  static create(
    values: ProductionOrderLineValues,
  ): Either<InvalidLineValuesError, ProductionOrderLine> {
    const numbers = [
      values.requiredQuantity,
      values.completedQuantity,
      values.unitTimeSeconds,
      values.setupTimeSeconds,
    ];
    const productionTime =
      values.requiredQuantity * values.unitTimeSeconds +
      values.setupTimeSeconds;

    if (
      numbers.some((number) => !Number.isSafeInteger(number) || number < 0) ||
      values.completedQuantity > values.requiredQuantity ||
      !Number.isSafeInteger(productionTime)
    ) {
      return left(new InvalidLineValuesError());
    }

    return right(new ProductionOrderLine({ ...values }));
  }
}
