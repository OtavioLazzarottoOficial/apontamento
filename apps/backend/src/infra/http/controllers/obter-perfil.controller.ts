import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { UsuariosRepository } from '../../../domain/auth/application/repositories/usuarios-repository.ts';
import { CurrentUser } from '../../auth/current-user-decorator.ts';
import type { UserPayload } from '../../auth/jwt.strategy.ts';

@Controller('/me')
export class ObterPerfilController {
  constructor(private readonly usuarios: UsuariosRepository) {}

  @Get()
  async handle(@CurrentUser() autenticado: UserPayload) {
    const usuario = await this.usuarios.buscarPorId(autenticado.sub);
    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    return {
      id: usuario.id.toString(),
      email: usuario.email,
      papel: usuario.papel,
      podeEditar: usuario.podeEditar,
      podeExportar: usuario.podeExportar,
    };
  }
}
