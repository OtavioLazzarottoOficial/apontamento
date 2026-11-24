import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { Relatorio, type ValorRelatorio } from '../../enterprise/relatorio.ts';
import { RelatoriosRepository } from '../repositories/relatorios-repository.ts';
import { ConflitoDeVersaoError } from './errors/conflito-de-versao-error.ts';
import { RelatorioNaoEncontradoError } from './errors/relatorio-nao-encontrado-error.ts';

interface Request {
  id: string;
  versaoEsperada: number;
  conteudo: { [key: string]: ValorRelatorio };
}

type Response = Either<
  RelatorioNaoEncontradoError | ConflitoDeVersaoError,
  { relatorio: Relatorio }
>;

@Injectable()
export class AtualizarRelatorioUseCase {
  constructor(private readonly relatorios: RelatoriosRepository) {}

  async execute(request: Request): Promise<Response> {
    const atual = await this.relatorios.buscarPorId(request.id);

    if (!atual) {
      return left(new RelatorioNaoEncontradoError());
    }

    if (atual.versao !== request.versaoEsperada) {
      return left(new ConflitoDeVersaoError());
    }

    const relatorio = Relatorio.create(
      { conteudo: request.conteudo, versao: atual.versao + 1 },
      atual.id,
    );
    const atualizado = await this.relatorios.atualizarSeVersaoCorresponde(
      relatorio,
      request.versaoEsperada,
    );

    if (!atualizado) {
      return left(new ConflitoDeVersaoError());
    }

    return right({ relatorio });
  }
}
