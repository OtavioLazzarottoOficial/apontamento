import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { left, type Either } from '../../../../core/either.ts';
import type { Relatorio, ValorRelatorio } from '../../enterprise/relatorio.ts';
import { RelatoriosRepository } from '../repositories/relatorios-repository.ts';
import { AtualizarRelatorioUseCase } from './atualizar-relatorio-usecase.ts';
import { ConflitoDeVersaoError } from './errors/conflito-de-versao-error.ts';
import { LinhaNaoEncontradaError } from './errors/linha-nao-encontrada-error.ts';
import { RelatorioNaoEncontradoError } from './errors/relatorio-nao-encontrado-error.ts';

@Injectable()
export class AlterarConclusaoLinhaUseCase {
  constructor(private readonly relatorios: RelatoriosRepository, private readonly atualizar: AtualizarRelatorioUseCase) {}

  async execute(request: { id: string; indice: number; versaoEsperada: number; concluida: boolean }): Promise<Either<RelatorioNaoEncontradoError | ConflitoDeVersaoError | LinhaNaoEncontradaError, { relatorio: Relatorio }>> {
    const atual = await this.relatorios.buscarPorId(request.id);
    if (!atual) return left(new RelatorioNaoEncontradoError());
    if (atual.versao !== request.versaoEsperada) return left(new ConflitoDeVersaoError());
    const conteudo = z.object({ linhas: z.array(z.object({}).passthrough()) }).passthrough().parse(structuredClone(atual.conteudo));
    const linha = conteudo.linhas[request.indice];
    if (!linha) return left(new LinhaNaoEncontradaError());
    linha.concluida = request.concluida;
    return this.atualizar.execute({ id: request.id, versaoEsperada: request.versaoEsperada, conteudo: conteudo as { [key: string]: ValorRelatorio } });
  }
}
