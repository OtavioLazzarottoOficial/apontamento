import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from '../../../domain/auth/application/repositories/users-repository.ts';
import { CurrentUser } from '../../auth/current-user-decorator.ts';
import type { UserPayload } from '../../auth/jwt.strategy.ts';
import { UserPresenter } from '../presenters/user-presenter.ts';

@Controller('/me')
export class GetProfileController {
  constructor(private readonly users: UsersRepository) {}

  @Get()
  async handle(@CurrentUser() authenticated: UserPayload) {
    const user = await this.users.findById(authenticated.sub);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    return UserPresenter.toHTTP(user);
  }
}
