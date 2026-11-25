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
import { UpdatePermissionsUseCase } from '../../../domain/auth/application/usecases/update-permissions-usecase.ts';
import { ListUsersUseCase } from '../../../domain/auth/application/usecases/list-users-usecase.ts';
import { AdministratorGuard } from '../../auth/administrator.guard.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';
import { UserPresenter } from '../presenters/user-presenter.ts';

const schema = z.object({ podeEditar: z.boolean(), podeExportar: z.boolean() });

@Controller('/usuarios')
@UseGuards(AdministratorGuard)
export class ManageUsersController {
  constructor(
    private readonly list: ListUsersUseCase,
    private readonly change: UpdatePermissionsUseCase,
  ) {}

  @Get()
  async listarUsuarios() {
    const resultado = await this.list.execute();
    if (resultado.isLeft()) {
      throw new Error('Falha inesperada ao listar usuários.');
    }
    return {
      usuarios: resultado.value.usuarios.map((usuario) =>
        UserPresenter.toHTTP(usuario),
      ),
    };
  }

  @Patch(':id/permissoes')
  async alterarPermissoes(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const resultado = await this.change.execute({ id, ...body });
    if (resultado.isLeft())
      throw new NotFoundException(resultado.value.message);
    return UserPresenter.toHTTP(resultado.value.usuario);
  }
}
