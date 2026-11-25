import { Injectable } from '@nestjs/common';
import { CapacityConfigurationsRepository } from '../../../../domain/production/application/repositories/capacity-configurations-repository.ts';
import type { CapacityConfiguration } from '../../../../domain/production/enterprise/capacity-configuration.ts';
import { PrismaCapacityConfigurationMapper } from '../mappers/prisma-capacity-configuration-mapper.ts';
import { PrismaService } from '../prisma.service.ts';

@Injectable()
export class PrismaCapacityConfigurationsRepository extends CapacityConfigurationsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async find() {
    const record = await this.prisma.capacityConfiguration.findUnique({
      where: { id: 1 },
    });
    return record ? PrismaCapacityConfigurationMapper.toDomain(record) : null;
  }

  async save(configuration: CapacityConfiguration) {
    const data = { efficiencyPercentage: configuration.efficiencyPercentage };
    await this.prisma.capacityConfiguration.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
  }
}
