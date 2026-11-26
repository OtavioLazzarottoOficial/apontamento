import { describe, expect, it } from 'vitest';
import { User } from '../../../domain/auth/enterprise/user.ts';
import { UserPresenter } from './user-presenter.ts';

describe('UserPresenter', () => {
  it('preserves the existing HTTP role while not exposing the password hash', () => {
    const user = User.create({
      email: 'admin@example.test',
      passwordHash: 'secret-hash',
      role: 'ADMIN',
      canEdit: true,
      canExport: true,
    });
    expect(UserPresenter.toHTTP(user)).toMatchObject({
      email: 'admin@example.test',
      papel: 'ADMINISTRADOR',
    });
    expect(UserPresenter.toHTTP(user)).not.toHaveProperty('passwordHash');
  });
});
