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
        role: raw.role,
        canEdit: raw.canEdit,
        canExport: raw.canExport,
      },
      new UniqueEntityID(raw.id),
    );
  }

  async list() {
    const usuarios = await this.prisma.user.findMany({
      orderBy: { email: 'asc' },
    });
    return usuarios.map((usuario) => this.toDomain(usuario));
  }

  async updatePermissions(
    id: string,
    podeEditar: boolean,
    podeExportar: boolean,
  ) {
    const resultado = await this.prisma.user.updateMany({
      where: { id, role: 'USUARIO' },
      data: { canEdit: podeEditar, canExport: podeExportar },
    });
    if (resultado.count === 0) return null;
    return this.findById(id);
  }

  async createIfEmailAvailable(usuario: User) {
    const resultado = await this.prisma.user.createMany({
      data: [
        {
          id: usuario.id.toString(),
          email: usuario.email,
          passwordHash: usuario.passwordHash,
          role: usuario.role,
          canEdit: usuario.canEdit,
          canExport: usuario.canExport,
        },
      ],
      skipDuplicates: true,
    });
    return resultado.count === 1;
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
