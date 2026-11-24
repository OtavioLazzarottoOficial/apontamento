import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsuariosRepository } from '../../domain/auth/application/repositories/usuarios-repository.ts';
import type { UserPayload } from './jwt.strategy.ts';

@Injectable()
export class UsuarioExistenteGuard implements CanActivate {
  constructor(private readonly usuarios: UsuariosRepository) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user: UserPayload }>();
    if (!(await this.usuarios.buscarPorId(request.user.sub))) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    return true;
  }
}
