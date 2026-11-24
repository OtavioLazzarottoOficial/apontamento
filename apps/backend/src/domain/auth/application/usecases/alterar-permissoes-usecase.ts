import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import type { Usuario } from '../../enterprise/usuario.ts';
import { UsuariosRepository } from '../repositories/usuarios-repository.ts';
import { UsuarioNaoEncontradoError } from './errors/usuario-nao-encontrado-error.ts';

@Injectable()
export class AlterarPermissoesUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}
  async execute(request: {
    id: string;
    podeEditar: boolean;
    podeExportar: boolean;
  }): Promise<Either<UsuarioNaoEncontradoError, { usuario: Usuario }>> {
    const usuario = await this.usuarios.atualizarPermissoes(
      request.id,
      request.podeEditar,
      request.podeExportar,
    );
    if (!usuario) return left(new UsuarioNaoEncontradoError());
    return right({ usuario });
  }
}
