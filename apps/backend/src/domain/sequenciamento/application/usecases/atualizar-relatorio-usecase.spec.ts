import { beforeEach, describe, expect, it } from 'vitest';
import { makeRelatorio } from '../../../../../test/factories/make-relatorio.ts';
import { RelatoriosRepositoryInMemory } from '../../../../../test/repositories-in-memory/relatorios-repository-in-memory.ts';
import { AtualizarRelatorioUseCase } from './atualizar-relatorio-usecase.ts';
import { ConflitoDeVersaoError } from './errors/conflito-de-versao-error.ts';
import { RelatorioNaoEncontradoError } from './errors/relatorio-nao-encontrado-error.ts';

describe('Atualizar relatório', () => {
  let repository: RelatoriosRepositoryInMemory;
  let sut: AtualizarRelatorioUseCase;

  beforeEach(() => {
    repository = new RelatoriosRepositoryInMemory();
    sut = new AtualizarRelatorioUseCase(repository);
  });

  it('salva a versão seguinte', async () => {
    const relatorio = makeRelatorio({ versao: 1 });
    repository.items.push(relatorio);
    const result = await sut.execute({
      id: relatorio.id.toString(),
      versaoEsperada: 1,
      conteudo: { nome: 'Atualizado' },
    });
    expect(result.isRight()).toBe(true);
    expect(repository.items[0].versao).toBe(2);
    expect(repository.items[0].conteudo).toEqual({ nome: 'Atualizado' });
  });

  it('recusa alteração baseada em versão antiga sem sobrescrever a atual', async () => {
    const relatorio = makeRelatorio({ versao: 2, conteudo: { nome: 'Atual' } });
    repository.items.push(relatorio);
    const result = await sut.execute({
      id: relatorio.id.toString(),
      versaoEsperada: 1,
      conteudo: { nome: 'Antigo' },
    });
    expect(result.value).toBeInstanceOf(ConflitoDeVersaoError);
    expect(repository.items[0].conteudo).toEqual({ nome: 'Atual' });
  });

  it('recusa a gravação se ocorrer outra alteração depois da leitura', async () => {
    const relatorio = makeRelatorio({ versao: 1 });
    repository.items.push(relatorio);
    repository.atualizarSeVersaoCorresponde = async () => false;
    const result = await sut.execute({
      id: relatorio.id.toString(),
      versaoEsperada: 1,
      conteudo: {},
    });
    expect(result.value).toBeInstanceOf(ConflitoDeVersaoError);
    expect(repository.items[0]).toBe(relatorio);
  });

  it('informa quando o relatório não existe', async () => {
    const result = await sut.execute({
      id: 'ausente',
      versaoEsperada: 1,
      conteudo: {},
    });
    expect(result.value).toBeInstanceOf(RelatorioNaoEncontradoError);
  });
});
