import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from '../../../domain/auth/application/repositories/users-repository.ts';
import { CurrentUser } from '../../auth/current-user-decorator.ts';
import type { UserPayload } from '../../auth/jwt.strategy.ts';

@Controller('/me')
export class GetProfileController {
  constructor(private readonly users: UsersRepository) {}

  @Get()
  async handle(@CurrentUser() autenticado: UserPayload) {
    const usuario = await this.users.findById(autenticado.sub);
    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    return {
      id: usuario.id.toString(),
      email: usuario.email,
      papel: usuario.role,
      podeEditar: usuario.canEdit,
      podeExportar: usuario.canExport,
    };
  }
}
