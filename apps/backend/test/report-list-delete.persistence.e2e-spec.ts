import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/infra/app.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
import { ReportsRepository } from '../src/domain/sequencing/application/repositories/reports-repository.ts';
const isolated =
  process.env.TEST_ISOLATED_REPORTS_DATABASE === '1' ? describe : describe.skip;
isolated('shared report summaries and removal in PostgreSQL', () => {
  const id = randomUUID();
  let prisma: PrismaService;
  let reports: ReportsRepository;
  let close: () => Promise<void>;
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      !url.pathname.startsWith('/apontamento_test_')
    )
      throw new Error('Requires an isolated local apontamento_test_ database.');
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = module.get(PrismaService);
    reports = module.get(ReportsRepository);
    close = () => module.close();
    await prisma.sequencingReport.create({
      data: {
        id,
        version: 3,
        content: {
          nome: 'Mapa.pdf',
          machineId: 'machine-a',
          pdfBase64: 'private',
          linhas: [
            { dataEntrega: '12/11/2026', area: 1.25 },
            { dataEntrega: '12/11/2026', area: 2 },
          ],
        },
      },
    });
  });
  afterAll(async () => {
    if (prisma) await prisma.sequencingReport.deleteMany({ where: { id } });
    if (close) await close();
  });
  it('returns date and machine summaries and deletes only the matching version', async () => {
    const summary = (await reports.list()).find((report) => report.id === id);
    expect(summary).toMatchObject({
      nome: 'Mapa.pdf',
      machineId: 'machine-a',
      dailyAreas: [{ date: '12/11/2026', area: 3.25 }],
    });
    expect(summary).not.toHaveProperty('pdfBase64');
    expect(await reports.deleteIfVersionMatches(id, 2)).toBe(false);
    expect(await reports.findById(id)).not.toBeNull();
    expect(await reports.deleteIfVersionMatches(id, 3)).toBe(true);
    expect(await reports.findById(id)).toBeNull();
  });
});
