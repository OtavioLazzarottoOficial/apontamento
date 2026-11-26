import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { User } from '../../enterprise/user.ts';
import { HashGenerator } from '../cryptography/hash-generator.ts';
import { UsersRepository } from '../repositories/users-repository.ts';
import { EmailAlreadyRegisteredError } from './errors/email-already-registered-error.ts';
import { InvalidPasswordError } from './errors/invalid-password-error.ts';

interface Request {
  email: string;
  password: string;
  canEdit: boolean;
  canExport: boolean;
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
    Either<InvalidPasswordError | EmailAlreadyRegisteredError, { user: User }>
  > {
    if (
      request.password.length < 8 ||
      Buffer.byteLength(request.password, 'utf8') > 72
    ) {
      return left(new InvalidPasswordError());
    }
    const passwordHash = await this.hashGenerator.hash(request.password);
    const user = User.create({
      email: request.email.trim().toLowerCase(),
      passwordHash,
      role: 'USER',
      canEdit: request.canEdit,
      canExport: request.canExport,
    });
    if (!(await this.users.createIfEmailAvailable(user))) {
      return left(new EmailAlreadyRegisteredError());
    }
    return right({ user });
  }
}
