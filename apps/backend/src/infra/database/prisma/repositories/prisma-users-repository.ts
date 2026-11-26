import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';
import { UsersRepository } from '../../../../domain/auth/application/repositories/users-repository.ts';
import { User } from '../../../../domain/auth/enterprise/user.ts';
import type { User as PrismaUser } from '../generated/client.ts';
import { PrismaService } from '../prisma.service.ts';

@Injectable()
export class PrismaUsersRepository extends UsersRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private toDomain(raw: PrismaUser): User {
    return User.create(
      {
        email: raw.email,
        passwordHash: raw.passwordHash,
        role: raw.role === 'ADMINISTRADOR' ? 'ADMIN' : 'USER',
        canEdit: raw.canEdit,
        canExport: raw.canExport,
      },
      new UniqueEntityID(raw.id),
    );
  }

  async list() {
    const users = await this.prisma.user.findMany({
      orderBy: { email: 'asc' },
    });
    return users.map((user) => this.toDomain(user));
  }

  async updatePermissions(id: string, canEdit: boolean, canExport: boolean) {
    const result = await this.prisma.user.updateMany({
      where: { id, role: 'USUARIO' },
      data: { canEdit: canEdit, canExport: canExport },
    });
    if (result.count === 0) return null;
    return this.findById(id);
  }

  async createIfEmailAvailable(user: User) {
    const result = await this.prisma.user.createMany({
      data: [
        {
          id: user.id.toString(),
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role === 'ADMIN' ? 'ADMINISTRADOR' : 'USUARIO',
          canEdit: user.canEdit,
          canExport: user.canExport,
        },
      ],
      skipDuplicates: true,
    });
    return result.count === 1;
  }

  async findByEmail(email: string) {
    const raw = await this.prisma.user.findUnique({ where: { email } });
    return raw ? this.toDomain(raw) : null;
  }

  async findById(id: string) {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }
}
