import { Injectable } from '@nestjs/common';
import type { CapacityConfiguration } from '../../enterprise/capacity-configuration.ts';

@Injectable()
export abstract class CapacityConfigurationsRepository {
  abstract find(): Promise<CapacityConfiguration | null>;
  abstract save(configuration: CapacityConfiguration): Promise<void>;
}
