import { describe, expect, it } from 'vitest';
import { InMemoryCapacityConfigurationsRepository } from '../../../../../test/repositories-in-memory/in-memory-capacity-configurations-repository.ts';
import { GetCapacityConfigurationUseCase } from './get-capacity-configuration-usecase.ts';
import { UpdateCapacityConfigurationUseCase } from './update-capacity-configuration-usecase.ts';

describe('capacity configuration', () => {
  it('returns 80% by default and persists a valid change', async () => {
    const repository = new InMemoryCapacityConfigurationsRepository();
    const get = new GetCapacityConfigurationUseCase(repository);
    const update = new UpdateCapacityConfigurationUseCase(repository);
    expect((await get.execute()).value).toEqual({ efficiencyPercentage: 80 });
    expect((await update.execute(85)).isRight()).toBe(true);
    expect((await get.execute()).value).toEqual({ efficiencyPercentage: 85 });
  });

  it.each([0, 101, 80.5])(
    'rejects invalid efficiency %s without persisting it',
    async (value) => {
      const repository = new InMemoryCapacityConfigurationsRepository();
      const result = await new UpdateCapacityConfigurationUseCase(
        repository,
      ).execute(value);
      expect(result.isLeft()).toBe(true);
      expect(repository.configuration).toBeNull();
    },
  );
});
