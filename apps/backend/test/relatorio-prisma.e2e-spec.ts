import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/infra/app.module.ts';
import { DatabaseModule } from '../src/infra/database/database.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
import { RelatoriosRepository } from '../src/domain/sequenciamento/application/repositories/relatorios-repository.ts';
import { AtualizarRelatorioUseCase } from '../src/domain/sequenciamento/application/usecases/atualizar-relatorio-usecase.ts';

const describeDatabase =
  process.env.TEST_REAL_DATABASE === '1' ? describe : describe.skip;

describeDatabase('concorrência de relatórios no PostgreSQL', () => {
  const id = randomUUID();
  let prisma: PrismaService;
  let sut: AtualizarRelatorioUseCase;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [AtualizarRelatorioUseCase],
    }).compile();
    prisma = module.get(PrismaService);
    sut = module.get(AtualizarRelatorioUseCase);
    expect(module.get(RelatoriosRepository)).toBeDefined();
    close = () => module.close();
    await prisma.relatorioSequenciamento.create({
      data: { id, versao: 1, conteudo: { titulo: 'Original' } },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.relatorioSequenciamento.deleteMany({ where: { id } });
    }
    if (close) {
      await close();
    }
  });

  it('permite apenas uma das duas gravações da mesma versão', async () => {
    const results = await Promise.all([
      sut.execute({ id, versaoEsperada: 1, conteudo: { titulo: 'Primeira' } }),
      sut.execute({ id, versaoEsperada: 1, conteudo: { titulo: 'Segunda' } }),
    ]);
    expect(results.filter((result) => result.isRight())).toHaveLength(1);
    expect(results.filter((result) => result.isLeft())).toHaveLength(1);
    const saved = await prisma.relatorioSequenciamento.findUniqueOrThrow({
      where: { id },
    });
    expect(saved.versao).toBe(2);
    expect(['Primeira', 'Segunda']).toContain(
      (saved.conteudo as { titulo: string }).titulo,
    );
  });
});
