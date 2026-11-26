import { ValueObject } from '../../../../core/entities/object-value.ts';
import { left, right, type Either } from '../../../../core/either.ts';
import { InvalidLineValuesError } from '../errors/invalid-line-values-error.ts';
import { calculateAreaInHundredths } from '../services/calculate-area.ts';
import {
  ProductionOrderLineObjectValue,
  type ProductionOrderLineObjectValueProps,
} from './production-order-line-object-value.ts';

export interface SequencingLineProps extends ProductionOrderLineObjectValueProps {
  deliveryDate: string;
  schedule: string;
  batch: string;
  lengthMm: string;
  widthMm: string;
}

interface SequencingLineValues {
  deliveryDate: string;
  schedule: string;
  batch: string;
  lengthMm: string;
  widthMm: string;
  production: ProductionOrderLineObjectValue;
  areaInHundredths: number;
}

export class SequencingLineObjectValue extends ValueObject<SequencingLineValues> {
  get deliveryDate() {
    return this.props.deliveryDate;
  }
  get schedule() {
    return this.props.schedule;
  }
  get batch() {
    return this.props.batch;
  }
  get requiredQuantity() {
    return this.props.production.requiredQuantity;
  }
  get completedQuantity() {
    return this.props.production.completedQuantity;
  }
  get balance() {
    return this.props.production.balance;
  }
  get productionTimeSeconds() {
    return this.props.production.productionTimeSeconds;
  }
  get areaInHundredths() {
    return this.props.areaInHundredths;
  }

  static create(
    props: SequencingLineProps,
  ): Either<InvalidLineValuesError, SequencingLineObjectValue> {
    const production = ProductionOrderLineObjectValue.create({
      requiredQuantity: props.requiredQuantity,
      completedQuantity: props.completedQuantity,
      unitTimeSeconds: props.unitTimeSeconds,
      setupTimeSeconds: props.setupTimeSeconds,
    });
    if (production.isLeft()) return left(production.value);
    const areaInHundredths = calculateAreaInHundredths(
      props.lengthMm,
      props.widthMm,
      props.requiredQuantity,
    );
    if (areaInHundredths === null) {
      return left(new InvalidLineValuesError());
    }
    return right(
      new SequencingLineObjectValue({
        deliveryDate: props.deliveryDate,
        schedule: props.schedule,
        batch: props.batch,
        lengthMm: props.lengthMm,
        widthMm: props.widthMm,
        production: production.value,
        areaInHundredths,
      }),
    );
  }
}
