import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { CapacityConfiguration } from '../../enterprise/capacity-configuration.ts';
import { CapacityConfigurationsRepository } from '../repositories/capacity-configurations-repository.ts';
import { InvalidEfficiencyError } from '../../enterprise/errors/invalid-efficiency-error.ts';

@Injectable()
export class UpdateCapacityConfigurationUseCase {
  constructor(
    private readonly configurations: CapacityConfigurationsRepository,
  ) {}

  async execute(
    efficiencyPercentage: number,
  ): Promise<
    Either<InvalidEfficiencyError, { configuration: CapacityConfiguration }>
  > {
    const result = CapacityConfiguration.create(efficiencyPercentage);
    if (result.isLeft()) {
      return left(result.value);
    }

    await this.configurations.save(result.value);
    return right({ configuration: result.value });
  }
}
