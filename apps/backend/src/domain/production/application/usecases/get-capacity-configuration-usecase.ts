import { Injectable } from '@nestjs/common';
import { right, type Either } from '../../../../core/either.ts';
import { CapacityConfigurationsRepository } from '../repositories/capacity-configurations-repository.ts';

@Injectable()
export class GetCapacityConfigurationUseCase {
  constructor(
    private readonly configurations: CapacityConfigurationsRepository,
  ) {}

  async execute(): Promise<Either<null, { efficiencyPercentage: number }>> {
    const configuration = await this.configurations.find();
    return right({
      efficiencyPercentage: configuration?.efficiencyPercentage ?? 80,
    });
  }
}
