import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { Usuario } from '../../enterprise/usuario.ts';
import { HashGenerator } from '../crypthograpy/hash-generator.ts';
import { UsuariosRepository } from '../repositories/usuarios-repository.ts';
import { EmailJaCadastradoError } from './errors/email-ja-cadastrado-error.ts';
import { SenhaInvalidaError } from './errors/senha-invalida-error.ts';

interface Request {
  email: string;
  senha: string;
  podeEditar: boolean;
  podeExportar: boolean;
}

@Injectable()
export class CadastrarUsuarioUseCase {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute(
    request: Request,
  ): Promise<
    Either<SenhaInvalidaError | EmailJaCadastradoError, { usuario: Usuario }>
  > {
    if (
      request.senha.length < 8 ||
      Buffer.byteLength(request.senha, 'utf8') > 72
    ) {
      return left(new SenhaInvalidaError());
    }
    const senhaHash = await this.hashGenerator.hash(request.senha);
    const usuario = Usuario.create({
      email: request.email.trim().toLowerCase(),
      senhaHash,
      papel: 'USUARIO',
      podeEditar: request.podeEditar,
      podeExportar: request.podeExportar,
    });
    if (!(await this.usuarios.criarSeEmailDisponivel(usuario))) {
      return left(new EmailJaCadastradoError());
    }
    return right({ usuario });
  }
}
