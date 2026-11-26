import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersRepository } from '../../domain/auth/application/repositories/users-repository.ts';
import type { UserPayload } from './jwt.strategy.ts';

@Injectable()
export class AdministratorGuard implements CanActivate {
  constructor(private readonly users: UsersRepository) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user: UserPayload }>();
    const user = await this.users.findById(request.user.sub);
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Somente administradores podem realizar esta ação.',
      );
    }
    return true;
  }
}
