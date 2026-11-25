import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { HashComparer } from '../crypthograpy/hash-comparer.ts';
import { Encrypter } from '../crypthograpy/encrypter.ts';
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
    senha,
  }: {
    email: string;
    senha: string;
  }): Promise<Either<InvalidCredentialsError, { token: string }>> {
    const usuario = await this.users.findByEmail(email.trim().toLowerCase());

    if (
      !usuario ||
      !(await this.hashComparer.compare(senha, usuario.passwordHash))
    ) {
      return left(new InvalidCredentialsError());
    }

    const token = await this.encrypter.encrypty({ sub: usuario.id.toString() });
    return right({ token });
  }
}
