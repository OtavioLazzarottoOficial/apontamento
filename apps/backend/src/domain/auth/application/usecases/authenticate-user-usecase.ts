import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { HashComparer } from '../cryptography/hash-comparer.ts';
import { Encrypter } from '../cryptography/encrypter.ts';
import { UsersRepository } from '../repositories/users-repository.ts';
import { InvalidCredentialsError } from './errors/invalid-credentials-error.ts';

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    private readonly users: UsersRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<Either<InvalidCredentialsError, { token: string }>> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());

    if (
      !user ||
      !(await this.hashComparer.compare(password, user.passwordHash))
    ) {
      return left(new InvalidCredentialsError());
    }

    const token = await this.encrypter.encrypt({ sub: user.id.toString() });
    return right({ token });
  }
}
