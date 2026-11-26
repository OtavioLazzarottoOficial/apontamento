import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import type { User } from '../../enterprise/user.ts';
import { UsersRepository } from '../repositories/users-repository.ts';
import { UserNotFoundError } from './errors/user-not-found-error.ts';

@Injectable()
export class UpdatePermissionsUseCase {
  constructor(private readonly users: UsersRepository) {}
  async execute(request: {
    id: string;
    canEdit: boolean;
    canExport: boolean;
  }): Promise<Either<UserNotFoundError, { user: User }>> {
    const user = await this.users.updatePermissions(
      request.id,
      request.canEdit,
      request.canExport,
    );
    if (!user) return left(new UserNotFoundError());
    return right({ user });
  }
}
