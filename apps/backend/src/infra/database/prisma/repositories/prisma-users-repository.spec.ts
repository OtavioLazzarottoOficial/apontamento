import { describe, expect, it, vi } from 'vitest';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';
import { User } from '../../../../domain/auth/enterprise/user.ts';
import { PrismaUsersRepository } from './prisma-users-repository.ts';
import type { PrismaService } from '../prisma.service.ts';

describe('PrismaUsersRepository role compatibility', () => {
  it('maps the persisted administrator role into the domain', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'admin@example.test',
          passwordHash: 'hash',
          role: 'ADMINISTRADOR',
          canEdit: true,
          canExport: true,
        }),
      },
    };
    const repository = new PrismaUsersRepository(
      prisma as unknown as PrismaService,
    );
    expect((await repository.findById('user-1'))?.role).toBe('ADMIN');
  });
  it('keeps legacy role values in persisted writes', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = { user: { createMany } };
    const repository = new PrismaUsersRepository(
      prisma as unknown as PrismaService,
    );
    const user = User.create(
      {
        email: 'user@example.test',
        passwordHash: 'hash',
        role: 'USER',
        canEdit: true,
        canExport: false,
      },
      new UniqueEntityID('user-2'),
    );
    expect(await repository.createIfEmailAvailable(user)).toBe(true);
    expect(createMany.mock.calls[0][0].data[0].role).toBe('USUARIO');
  });
});
