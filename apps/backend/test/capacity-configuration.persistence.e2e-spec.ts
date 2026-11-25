import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/infra/app.module.ts';
import { DatabaseModule } from '../src/infra/database/database.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
import { GetCapacityConfigurationUseCase } from '../src/domain/production/application/usecases/get-capacity-configuration-usecase.ts';
import { UpdateCapacityConfigurationUseCase } from '../src/domain/production/application/usecases/update-capacity-configuration-usecase.ts';

const describeDatabase =
  process.env.TEST_ISOLATED_CAPACITY_DATABASE === '1'
    ? describe
    : describe.skip;

describeDatabase('capacity configuration with PostgreSQL', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let getConfiguration: GetCapacityConfigurationUseCase;
  let updateConfiguration: UpdateCapacityConfigurationUseCase;

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      !url.pathname.startsWith('/apontamento_test_')
    ) {
      throw new Error(
        'Capacity persistence tests require an isolated local apontamento_test_ database.',
      );
    }
    const module = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        GetCapacityConfigurationUseCase,
        UpdateCapacityConfigurationUseCase,
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = module.get(PrismaService);
    getConfiguration = module.get(GetCapacityConfigurationUseCase);
    updateConfiguration = module.get(UpdateCapacityConfigurationUseCase);
    expect(
      await prisma.capacityConfiguration.findUnique({ where: { id: 1 } }),
    ).toBeNull();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('uses the default and persists changes through Nest providers', async () => {
    expect((await getConfiguration.execute()).value).toEqual({
      efficiencyPercentage: 80,
    });
    expect((await updateConfiguration.execute(85)).isRight()).toBe(true);
    expect((await getConfiguration.execute()).value).toEqual({
      efficiencyPercentage: 85,
    });
    expect(
      (
        await prisma.capacityConfiguration.findUniqueOrThrow({
          where: { id: 1 },
        })
      ).efficiencyPercentage,
    ).toBe(85);
  });
});
