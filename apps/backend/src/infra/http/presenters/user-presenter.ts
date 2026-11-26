import { User } from '../../../domain/auth/enterprise/user.ts';

export class UserPresenter {
  static toHTTP(user: User) {
    return {
      id: user.id.toString(),
      email: user.email,
      papel: user.role === 'ADMIN' ? 'ADMINISTRADOR' : 'USUARIO',
      podeEditar: user.canEdit,
      podeExportar: user.canExport,
    };
  }
}
