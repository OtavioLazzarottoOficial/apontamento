import { Injectable } from '@nestjs/common';
import type { Usuario } from '../../enterprise/usuario.ts';

@Injectable()
export abstract class UsuariosRepository {
  abstract listar(): Promise<Usuario[]>;
  abstract atualizarPermissoes(
    id: string,
    podeEditar: boolean,
    podeExportar: boolean,
  ): Promise<Usuario | null>;
  abstract criarSeEmailDisponivel(usuario: Usuario): Promise<boolean>;
  abstract buscarPorEmail(email: string): Promise<Usuario | null>;
  abstract buscarPorId(id: string): Promise<Usuario | null>;
}
