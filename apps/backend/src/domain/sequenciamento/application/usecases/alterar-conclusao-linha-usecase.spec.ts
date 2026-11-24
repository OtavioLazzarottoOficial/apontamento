import { describe, expect, it } from 'vitest';
import { RelatoriosRepositoryInMemory } from '../../../../../test/repositories-in-memory/relatorios-repository-in-memory.ts';
import { Relatorio } from '../../enterprise/relatorio.ts';
import { AtualizarRelatorioUseCase } from './atualizar-relatorio-usecase.ts';
import { AlterarConclusaoLinhaUseCase } from './alterar-conclusao-linha-usecase.ts';
import { ConflitoDeVersaoError } from './errors/conflito-de-versao-error.ts';
import { LinhaNaoEncontradaError } from './errors/linha-nao-encontrada-error.ts';

describe('conclusão de uma ordem', () => {
  it('persiste, reabre e preserva os valores da linha', async () => {
    const repo = new RelatoriosRepositoryInMemory();
    const relatorio = Relatorio.create({ conteudo: { linhas: [{ ordem: '123', realizada: 5 }] }, versao: 1 });
    repo.items.push(relatorio);
    const sut = new AlterarConclusaoLinhaUseCase(repo, new AtualizarRelatorioUseCase(repo));
    const request = { id: relatorio.id.toString(), indice: 0, versaoEsperada: 1, concluida: true };
    expect((await sut.execute(request)).isRight()).toBe(true);
    expect(repo.items[0].conteudo.linhas).toEqual([{ ordem: '123', realizada: 5, concluida: true }]);
    expect((await sut.execute({ ...request, concluida: false })).value).toBeInstanceOf(ConflitoDeVersaoError);
    expect((await sut.execute({ ...request, versaoEsperada: 2, concluida: false })).isRight()).toBe(true);
    expect(repo.items[0].conteudo.linhas).toEqual([{ ordem: '123', realizada: 5, concluida: false }]);
    expect((await sut.execute({ ...request, indice: 10, versaoEsperada: 3 })).value).toBeInstanceOf(LinhaNaoEncontradaError);
  });
});
