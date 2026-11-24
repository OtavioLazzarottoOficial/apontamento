import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { left, type Either } from '../../../../core/either.ts';
import type { Relatorio, ValorRelatorio } from '../../enterprise/relatorio.ts';
import { RelatoriosRepository } from '../repositories/relatorios-repository.ts';
import { AtualizarRelatorioUseCase } from './atualizar-relatorio-usecase.ts';
import { ConflitoDeVersaoError } from './errors/conflito-de-versao-error.ts';
import { RelatorioNaoEncontradoError } from './errors/relatorio-nao-encontrado-error.ts';
import { LinhaNaoEncontradaError } from './errors/linha-nao-encontrada-error.ts';

const referencia = z.object({
  pagina: z.number().int(),
  indice: z.number().int(),
});
const schema = z
  .object({
    linhas: z.array(
      z
        .object({
          ordem: z.string(),
          camposTexto: z.object({
            ordem: z.array(referencia),
            produto: z.array(referencia),
            componente: z.array(referencia),
            dimensoes: z.array(referencia),
          }),
        })
        .passthrough(),
    ),
    paginas: z.array(
      z
        .object({
          numero: z.number(),
          trechos: z.array(z.object({ texto: z.string() }).passthrough()),
        })
        .passthrough(),
    ),
  })
  .passthrough();

@Injectable()
export class AlterarTextoRelatorioUseCase {
  constructor(
    private readonly relatorios: RelatoriosRepository,
    private readonly atualizar: AtualizarRelatorioUseCase,
  ) {}

  async execute(request: {
    id: string;
    versaoEsperada: number;
    pagina: number;
    indice: number;
    texto: string;
  }): Promise<
    Either<
      | RelatorioNaoEncontradoError
      | ConflitoDeVersaoError
      | LinhaNaoEncontradaError,
      { relatorio: Relatorio }
    >
  > {
    const atual = await this.relatorios.buscarPorId(request.id);
    if (!atual) return left(new RelatorioNaoEncontradoError());
    if (atual.versao !== request.versaoEsperada)
      return left(new ConflitoDeVersaoError());
    const conteudo = schema.parse(structuredClone(atual.conteudo));
    const autorizado = conteudo.linhas.some((linha) =>
      [
        ...linha.camposTexto.ordem,
        ...linha.camposTexto.produto,
        ...linha.camposTexto.componente,
      ].some(
        (ref) => ref.pagina === request.pagina && ref.indice === request.indice,
      ),
    );
    const trecho = conteudo.paginas.find(
      (pagina) => pagina.numero === request.pagina,
    )?.trechos[request.indice];
    if (!autorizado || !trecho) return left(new LinhaNaoEncontradaError());
    trecho.texto = request.texto;
    for (const linha of conteudo.linhas) {
      if (
        linha.camposTexto.ordem.some(
          (ref) =>
            ref.pagina === request.pagina && ref.indice === request.indice,
        )
      ) {
        linha.ordem = request.texto;
      }
    }
    return this.atualizar.execute({
      id: request.id,
      versaoEsperada: request.versaoEsperada,
      conteudo: conteudo as unknown as { [key: string]: ValorRelatorio },
    });
  }
}
