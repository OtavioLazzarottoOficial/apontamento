import { ValueObject } from '../../../../core/entities/object-value.ts';
import { left, right, type Either } from '../../../../core/either.ts';
import { InvalidLineValuesError } from '../errors/invalid-line-values-error.ts';

export interface ProductionOrderLineObjectValueProps {
  requiredQuantity: number;
  completedQuantity: number;
  unitTimeSeconds: number;
  setupTimeSeconds: number;
}

export class ProductionOrderLineObjectValue extends ValueObject<ProductionOrderLineObjectValueProps> {
  get requiredQuantity() {
    return this.props.requiredQuantity;
  }

  get completedQuantity() {
    return this.props.completedQuantity;
  }
  get balance() {
    return this.props.requiredQuantity - this.props.completedQuantity;
  }

  get productionTimeSeconds() {
    return (
      this.props.requiredQuantity * this.props.unitTimeSeconds +
      this.props.setupTimeSeconds
    );
  }

  static create(
    values: ProductionOrderLineObjectValueProps,
  ): Either<InvalidLineValuesError, ProductionOrderLineObjectValue> {
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

    return right(new ProductionOrderLineObjectValue({ ...values }));
  }
}
