import { Entity } from '../../../core/entities/entity.ts';
import type { UniqueEntityID } from '../../../core/entities/unique-entity-id.ts';

export type PapelUsuario = 'ADMINISTRADOR' | 'USUARIO';
export interface UsuarioProps {
  email: string;
  senhaHash: string;
  papel: PapelUsuario;
  podeEditar: boolean;
  podeExportar: boolean;
}

export class Usuario extends Entity<UsuarioProps> {
  get email() {
    return this.props.email;
  }
  get senhaHash() {
    return this.props.senhaHash;
  }
  get papel() {
    return this.props.papel;
  }
  get podeEditar() {
    return this.props.podeEditar;
  }
  get podeExportar() {
    return this.props.podeExportar;
  }

  static create(props: UsuarioProps, id?: UniqueEntityID) {
    return new Usuario(props, id);
  }
}
