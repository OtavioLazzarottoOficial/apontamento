import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsuariosRepository } from '../../domain/auth/application/repositories/usuarios-repository.ts';
import type { UserPayload } from './jwt.strategy.ts';

@Injectable()
export class PermissaoExportarGuard implements CanActivate {
  constructor(private readonly usuarios: UsuariosRepository) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user: UserPayload }>();
    const usuario = await this.usuarios.buscarPorId(request.user.sub);
    if (
      !usuario ||
      (usuario.papel !== 'ADMINISTRADOR' && !usuario.podeExportar)
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para exportar relatórios.',
      );
    }
    return true;
  }
}
