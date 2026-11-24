import { Controller, Get, UseGuards } from '@nestjs/common';
import { ListarRelatoriosUseCase } from '../../../domain/sequenciamento/application/usecases/listar-relatorios-usecase.ts';
import { UsuarioExistenteGuard } from '../../auth/usuario-existente.guard.ts';

@Controller('/relatorios')
export class ListarRelatoriosController {
  constructor(private readonly listar: ListarRelatoriosUseCase) {}

  @Get()
  @UseGuards(UsuarioExistenteGuard)
  async handle() {
    const resultado = await this.listar.execute();
    return resultado.value;
  }
}
