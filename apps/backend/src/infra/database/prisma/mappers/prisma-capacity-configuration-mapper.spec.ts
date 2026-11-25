import { describe, expect, it } from 'vitest';
import { InvalidStoredCapacityConfigurationError } from '../../../errors/invalid-stored-capacity-configuration-error.ts';
import { PrismaCapacityConfigurationMapper } from './prisma-capacity-configuration-mapper.ts';

describe('PrismaCapacityConfigurationMapper', () => {
  it('maps the persisted percentage to the domain', () => {
    expect(
      PrismaCapacityConfigurationMapper.toDomain({ efficiencyPercentage: 85 })
        .efficiencyPercentage,
    ).toBe(85);
  });

  it.each([0, 101, 2.5])('rejects invalid persisted value %s', (efficiency) => {
    expect(() =>
      PrismaCapacityConfigurationMapper.toDomain({
        efficiencyPercentage: efficiency,
      }),
    ).toThrow(InvalidStoredCapacityConfigurationError);
  });
});
