import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';
import { UsuariosRepository } from '../../../../domain/auth/application/repositories/usuarios-repository.ts';
import { Usuario } from '../../../../domain/auth/enterprise/usuario.ts';
import type { Usuario as PrismaUsuario } from '../generated/client.ts';
import { PrismaService } from '../prisma.service.ts';

@Injectable()
export class PrismaUsuariosRepository extends UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private toDomain(raw: PrismaUsuario): Usuario {
    return Usuario.create(
      {
        email: raw.email,
        senhaHash: raw.senhaHash,
        papel: raw.papel,
        podeEditar: raw.podeEditar,
        podeExportar: raw.podeExportar,
      },
      new UniqueEntityID(raw.id),
    );
  }

  async listar() {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { email: 'asc' },
    });
    return usuarios.map((usuario) => this.toDomain(usuario));
  }

  async atualizarPermissoes(
    id: string,
    podeEditar: boolean,
    podeExportar: boolean,
  ) {
    const resultado = await this.prisma.usuario.updateMany({
      where: { id, papel: 'USUARIO' },
      data: { podeEditar, podeExportar },
    });
    if (resultado.count === 0) return null;
    return this.buscarPorId(id);
  }

  async criarSeEmailDisponivel(usuario: Usuario) {
    const resultado = await this.prisma.usuario.createMany({
      data: [
        {
          id: usuario.id.toString(),
          email: usuario.email,
          senhaHash: usuario.senhaHash,
          papel: usuario.papel,
          podeEditar: usuario.podeEditar,
          podeExportar: usuario.podeExportar,
        },
      ],
      skipDuplicates: true,
    });
    return resultado.count === 1;
  }

  async buscarPorEmail(email: string) {
    const raw = await this.prisma.usuario.findUnique({ where: { email } });
    return raw ? this.toDomain(raw) : null;
  }

  async buscarPorId(id: string) {
    const raw = await this.prisma.usuario.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }
}
