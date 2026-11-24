import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { HashComparer } from '../crypthograpy/hash-comparer.ts';
import { Encrypter } from '../crypthograpy/encrypter.ts';
import { UsuariosRepository } from '../repositories/usuarios-repository.ts';
import { CredenciaisInvalidasError } from './errors/credenciais-invalidas-error.ts';

@Injectable()
export class AutenticarUsuarioUseCase {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter,
  ) {}

  async execute({
    email,
    senha,
  }: {
    email: string;
    senha: string;
  }): Promise<Either<CredenciaisInvalidasError, { token: string }>> {
    const usuario = await this.usuarios.buscarPorEmail(
      email.trim().toLowerCase(),
    );

    if (
      !usuario ||
      !(await this.hashComparer.compare(senha, usuario.senhaHash))
    ) {
      return left(new CredenciaisInvalidasError());
    }

    const token = await this.encrypter.encrypty({ sub: usuario.id.toString() });
    return right({ token });
  }
}
