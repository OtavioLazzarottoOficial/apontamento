import { Usuario } from '../../../domain/auth/enterprise/usuario.ts';

export class UsuarioPresenter {
  static toHTTP(usuario: Usuario) {
    return {
      id: usuario.id.toString(),
      email: usuario.email,
      papel: usuario.papel,
      podeEditar: usuario.podeEditar,
      podeExportar: usuario.podeExportar,
    };
  }
}
