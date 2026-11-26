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
  async listUsers() {
    const result = await this.list.execute();
    if (result.isLeft()) {
      throw new Error('Falha inesperada ao listar usuários.');
    }
    return {
      usuarios: result.value.users.map((user) => UserPresenter.toHTTP(user)),
    };
  }

  @Patch(':id/permissoes')
  async updatePermissions(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>,
  ) {
    const result = await this.change.execute({
      id,
      canEdit: body.podeEditar,
      canExport: body.podeExportar,
    });
    if (result.isLeft()) throw new NotFoundException(result.value.message);
    return UserPresenter.toHTTP(result.value.user);
  }
}
