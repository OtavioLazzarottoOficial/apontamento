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
    podeEditar: boolean;
    podeExportar: boolean;
  }): Promise<Either<UserNotFoundError, { usuario: User }>> {
    const usuario = await this.users.updatePermissions(
      request.id,
      request.podeEditar,
      request.podeExportar,
    );
    if (!usuario) return left(new UserNotFoundError());
    return right({ usuario });
  }
}
