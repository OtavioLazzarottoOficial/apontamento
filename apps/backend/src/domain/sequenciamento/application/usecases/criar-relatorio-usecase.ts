import { Injectable } from '@nestjs/common';
import { right, type Either } from '../../../../core/either.ts';
import { Relatorio, type ValorRelatorio } from '../../enterprise/relatorio.ts';
import { RelatoriosRepository } from '../repositories/relatorios-repository.ts';

interface Request {
  conteudo: { [key: string]: ValorRelatorio };
}

@Injectable()
export class CriarRelatorioUseCase {
  constructor(private readonly relatorios: RelatoriosRepository) {}

  async execute(
    request: Request,
  ): Promise<Either<null, { relatorio: Relatorio }>> {
    const relatorio = Relatorio.create({
      conteudo: request.conteudo,
      versao: 1,
    });
    await this.relatorios.criar(relatorio);
    return right({ relatorio });
  }
}
