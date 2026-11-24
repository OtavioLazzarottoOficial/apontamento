import { describe, expect, it } from 'vitest';
import { RelatoriosRepositoryInMemory } from '../../../../../test/repositories-in-memory/relatorios-repository-in-memory.ts';
import { CriarRelatorioUseCase } from './criar-relatorio-usecase.ts';

describe('Criar relatório', () => {
  it('persiste o conteúdo na primeira versão', async () => {
    const repositorio = new RelatoriosRepositoryInMemory();
    const resultado = await new CriarRelatorioUseCase(repositorio).execute({
      conteudo: { paginas: [] },
    });
    expect(resultado.isRight()).toBe(true);
    expect(repositorio.items).toHaveLength(1);
    expect(repositorio.items[0].versao).toBe(1);
    expect(repositorio.items[0].conteudo).toEqual({ paginas: [] });
  });
});
