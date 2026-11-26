import { LegacyReportDocument } from '../src/infra/pdf/legacy-report-document.ts';
import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/infra/app.module.ts';
import { DatabaseModule } from '../src/infra/database/database.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
import { ReportsRepository } from '../src/domain/sequencing/application/repositories/reports-repository.ts';
import { UpdateReportUseCase } from '../src/domain/sequencing/application/usecases/update-report-usecase.ts';

const describeDatabase =
  process.env.TEST_REAL_DATABASE === '1' ? describe : describe.skip;

describeDatabase('concorrência de relatórios no PostgreSQL', () => {
  const id = randomUUID();
  let prisma: PrismaService;
  let sut: UpdateReportUseCase;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UpdateReportUseCase],
    }).compile();
    prisma = module.get(PrismaService);
    sut = module.get(UpdateReportUseCase);
    expect(module.get(ReportsRepository)).toBeDefined();
    close = () => module.close();
    await prisma.sequencingReport.create({
      data: { id, version: 1, content: { titulo: 'Original' } },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.sequencingReport.deleteMany({ where: { id } });
    }
    if (close) {
      await close();
    }
  });

  it('permite apenas uma das duas gravações da mesma versão', async () => {
    const results = await Promise.all([
      sut.execute({
        id,
        expectedVersion: 1,
        content: new LegacyReportDocument({ titulo: 'Primeira' }),
      }),
      sut.execute({
        id,
        expectedVersion: 1,
        content: new LegacyReportDocument({ titulo: 'Segunda' }),
      }),
    ]);
    expect(results.filter((result) => result.isRight())).toHaveLength(1);
    expect(results.filter((result) => result.isLeft())).toHaveLength(1);
    const saved = await prisma.sequencingReport.findUniqueOrThrow({
      where: { id },
    });
    expect(saved.version).toBe(2);
    expect(['Primeira', 'Segunda']).toContain(
      (saved.content as { titulo: string }).titulo,
    );
  });
});
