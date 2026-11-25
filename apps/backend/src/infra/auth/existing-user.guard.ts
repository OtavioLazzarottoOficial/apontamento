import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from '../../domain/auth/application/repositories/users-repository.ts';
import type { UserPayload } from './jwt.strategy.ts';

@Injectable()
export class ExistingUserGuard implements CanActivate {
  constructor(private readonly users: UsersRepository) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user: UserPayload }>();
    if (!(await this.users.findById(request.user.sub))) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    return true;
  }
}
