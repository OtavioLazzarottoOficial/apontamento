import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsuariosRepository } from '../../domain/auth/application/repositories/usuarios-repository.ts';
import type { UserPayload } from './jwt.strategy.ts';

@Injectable()
export class AdministradorGuard implements CanActivate {
  constructor(private readonly usuarios: UsuariosRepository) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user: UserPayload }>();
    const usuario = await this.usuarios.buscarPorId(request.user.sub);
    if (!usuario || usuario.papel !== 'ADMINISTRADOR') {
      throw new ForbiddenException(
        'Somente administradores podem realizar esta ação.',
      );
    }
    return true;
  }
}
