import { Injectable } from '@nestjs/common';
import { right, type Either } from '../../../../core/either.ts';
import type { Usuario } from '../../enterprise/usuario.ts';
import { UsuariosRepository } from '../repositories/usuarios-repository.ts';

@Injectable()
export class ListarUsuariosUseCase {
  constructor(private readonly usuarios: UsuariosRepository) {}
  async execute(): Promise<Either<null, { usuarios: Usuario[] }>> {
    return right({ usuarios: await this.usuarios.listar() });
  }
}
