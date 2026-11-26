import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersRepository } from '../../domain/auth/application/repositories/users-repository.ts';
import type { UserPayload } from './jwt.strategy.ts';

@Injectable()
export class ExportPermissionGuard implements CanActivate {
  constructor(private readonly users: UsersRepository) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user: UserPayload }>();
    const user = await this.users.findById(request.user.sub);
    if (!user || (user.role !== 'ADMIN' && !user.canExport)) {
      throw new ForbiddenException(
        'Você não tem permissão para exportar relatórios.',
      );
    }
    return true;
  }
}
