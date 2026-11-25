import { describe, expect, it } from 'vitest';
import { InMemoryReportsRepository } from '../../../../../test/repositories-in-memory/in-memory-reports-repository.ts';
import { CreateReportUseCase } from './create-report-usecase.ts';

describe('Criar relatório', () => {
  it('persiste o conteúdo na primeira versão', async () => {
    const repositorio = new InMemoryReportsRepository();
    const resultado = await new CreateReportUseCase(repositorio).execute({
      content: { paginas: [] },
    });
    expect(resultado.isRight()).toBe(true);
    expect(repositorio.items).toHaveLength(1);
    expect(repositorio.items[0].version).toBe(1);
    expect(repositorio.items[0].content).toEqual({ paginas: [] });
  });
});
