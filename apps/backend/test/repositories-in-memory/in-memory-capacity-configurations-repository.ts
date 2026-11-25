import { CapacityConfigurationsRepository } from '../../src/domain/production/application/repositories/capacity-configurations-repository.ts';
import type { CapacityConfiguration } from '../../src/domain/production/enterprise/capacity-configuration.ts';

export class InMemoryCapacityConfigurationsRepository extends CapacityConfigurationsRepository {
  configuration: CapacityConfiguration | null = null;

  async find() {
    return this.configuration;
  }

  async save(configuration: CapacityConfiguration) {
    this.configuration = configuration;
  }
}
