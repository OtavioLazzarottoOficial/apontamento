import { User } from '../../../domain/auth/enterprise/user.ts';

export class UserPresenter {
  static toHTTP(usuario: User) {
    return {
      id: usuario.id.toString(),
      email: usuario.email,
      papel: usuario.role,
      podeEditar: usuario.canEdit,
      podeExportar: usuario.canExport,
    };
  }
}
