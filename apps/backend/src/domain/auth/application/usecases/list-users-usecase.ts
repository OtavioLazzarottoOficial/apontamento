import { Injectable } from '@nestjs/common';
import { right, type Either } from '../../../../core/either.ts';
import type { User } from '../../enterprise/user.ts';
import { UsersRepository } from '../repositories/users-repository.ts';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly users: UsersRepository) {}
  async execute(): Promise<Either<null, { usuarios: User[] }>> {
    return right({ usuarios: await this.users.list() });
  }
}
