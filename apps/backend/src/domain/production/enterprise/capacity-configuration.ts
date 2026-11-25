import { left, right, type Either } from '../../../core/either.ts';
import { InvalidEfficiencyError } from './errors/invalid-efficiency-error.ts';

export class CapacityConfiguration {
  private constructor(readonly efficiencyPercentage: number) {}

  static create(
    efficiencyPercentage: number,
  ): Either<InvalidEfficiencyError, CapacityConfiguration> {
    if (
      !Number.isInteger(efficiencyPercentage) ||
      efficiencyPercentage < 1 ||
      efficiencyPercentage > 100
    ) {
      return left(new InvalidEfficiencyError());
    }

    return right(new CapacityConfiguration(efficiencyPercentage));
  }
}
