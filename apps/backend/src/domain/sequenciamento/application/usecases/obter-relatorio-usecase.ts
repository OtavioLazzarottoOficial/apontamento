import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import type { Relatorio } from '../../enterprise/relatorio.ts';
import { RelatoriosRepository } from '../repositories/relatorios-repository.ts';
import { RelatorioNaoEncontradoError } from './errors/relatorio-nao-encontrado-error.ts';

@Injectable()
export class ObterRelatorioUseCase {
  constructor(private readonly relatorios: RelatoriosRepository) {}

  async execute(
    id: string,
  ): Promise<Either<RelatorioNaoEncontradoError, { relatorio: Relatorio }>> {
    const relatorio = await this.relatorios.buscarPorId(id);
    if (!relatorio) {
      return left(new RelatorioNaoEncontradoError());
    }
    return right({ relatorio });
  }
}
