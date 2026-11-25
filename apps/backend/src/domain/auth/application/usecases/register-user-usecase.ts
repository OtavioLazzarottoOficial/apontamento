import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { User } from '../../enterprise/user.ts';
import { HashGenerator } from '../crypthograpy/hash-generator.ts';
import { UsersRepository } from '../repositories/users-repository.ts';
import { EmailAlreadyRegisteredError } from './errors/email-already-registered-error.ts';
import { InvalidPasswordError } from './errors/invalid-password-error.ts';

interface Request {
  email: string;
  senha: string;
  podeEditar: boolean;
  podeExportar: boolean;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly users: UsersRepository,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute(
    request: Request,
  ): Promise<
    Either<
      InvalidPasswordError | EmailAlreadyRegisteredError,
      { usuario: User }
    >
  > {
    if (
      request.senha.length < 8 ||
      Buffer.byteLength(request.senha, 'utf8') > 72
    ) {
      return left(new InvalidPasswordError());
    }
    const senhaHash = await this.hashGenerator.hash(request.senha);
    const usuario = User.create({
      email: request.email.trim().toLowerCase(),
      passwordHash: senhaHash,
      role: 'USUARIO',
      canEdit: request.podeEditar,
      canExport: request.podeExportar,
    });
    if (!(await this.users.createIfEmailAvailable(usuario))) {
      return left(new EmailAlreadyRegisteredError());
    }
    return right({ usuario });
  }
}
