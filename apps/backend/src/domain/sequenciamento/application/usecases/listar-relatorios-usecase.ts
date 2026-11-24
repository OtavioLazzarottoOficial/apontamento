import { Injectable } from '@nestjs/common';
import { right } from '../../../../core/either.ts';
import { RelatoriosRepository } from '../repositories/relatorios-repository.ts';

@Injectable()
export class ListarRelatoriosUseCase {
  constructor(private readonly relatorios: RelatoriosRepository) {}

  async execute() {
    return right({ relatorios: await this.relatorios.listar() });
  }
}
