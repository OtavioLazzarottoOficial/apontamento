import { CapacityConfiguration } from '../../../../domain/production/enterprise/capacity-configuration.ts';
import { InvalidStoredCapacityConfigurationError } from '../../../errors/invalid-stored-capacity-configuration-error.ts';

export class PrismaCapacityConfigurationMapper {
  static toDomain(record: {
    efficiencyPercentage: number;
  }): CapacityConfiguration {
    const result = CapacityConfiguration.create(record.efficiencyPercentage);
    if (result.isLeft()) {
      throw new InvalidStoredCapacityConfigurationError();
    }

    return result.value;
  }
}
