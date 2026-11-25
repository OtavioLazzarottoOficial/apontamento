import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/infra/app.module.ts';
import { ManageMachinesUseCase } from '../src/domain/production/application/usecases/manage-machines-usecase.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
const isolated =
  process.env.TEST_ISOLATED_MACHINES_DATABASE === '1'
    ? describe
    : describe.skip;
isolated('machines persistence with PostgreSQL', () => {
  let app: INestApplication;
  let machines: ManageMachinesUseCase;
  let prisma: PrismaService;
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      url.pathname !== '/machines_test'
    )
      throw new Error('Requires an isolated local machines_test database.');
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    machines = module.get(ManageMachinesUseCase);
    prisma = module.get(PrismaService);
  });
  afterAll(async () => {
    if (app) await app.close();
  });
  it('persists and identifies a registered machine through Nest and Prisma', async () => {
    const result = await machines.create(
      'Furadeira manual',
      'PO Furadeira Nanxing',
    );
    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw result.value;
    expect(
      (await machines.identify('PO Furadeira Nanxing'))?.id.toString(),
    ).toBe(result.value.id.toString());
    expect(
      await prisma.machine.findUnique({
        where: { id: result.value.id.toString() },
      }),
    ).toMatchObject({ name: 'Furadeira manual' });
  });
});
