import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AlterarPermissoesUseCase } from '../../../domain/auth/application/usecases/alterar-permissoes-usecase.ts';
import { ListarUsuariosUseCase } from '../../../domain/auth/application/usecases/listar-usuarios-usecase.ts';
import { AdministradorGuard } from '../../auth/administrador.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';
import { UsuarioPresenter } from '../presenters/usuario-presenter.ts';

const schema = z.object({ podeEditar: z.boolean(), podeExportar: z.boolean() });

@Controller('/usuarios')
@UseGuards(AdministradorGuard)
export class GerenciarUsuariosController {
  constructor(
    private readonly listar: ListarUsuariosUseCase,
    private readonly alterar: AlterarPermissoesUseCase,
  ) {}

  @Get()
  async listarUsuarios() {
    const resultado = await this.listar.execute();
    if (resultado.isLeft()) {
      throw new Error('Falha inesperada ao listar usuários.');
    }
    return { usuarios: resultado.value.usuarios.map((usuario) => UsuarioPresenter.toHTTP(usuario)) };
  }

  @Patch(':id/permissoes')
  async alterarPermissoes(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const resultado = await this.alterar.execute({ id, ...body });
    if (resultado.isLeft())
      throw new NotFoundException(resultado.value.message);
    return UsuarioPresenter.toHTTP(resultado.value.usuario);
  }
}
