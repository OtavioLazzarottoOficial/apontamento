import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../src/core/entities/unique-entity-id.ts';
import { UsuariosRepository } from '../src/domain/auth/application/repositories/usuarios-repository.ts';
import { Usuario } from '../src/domain/auth/enterprise/usuario.ts';
import { AppModule } from '../src/infra/app.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';

class UsuariosEmMemoria extends UsuariosRepository {
  items: Usuario[] = [];
  async listar() {
    return this.items;
  }
  async atualizarPermissoes(
    id: string,
    podeEditar: boolean,
    podeExportar: boolean,
  ) {
    const indice = this.items.findIndex(
      (item) => item.id.toString() === id && item.papel === 'USUARIO',
    );
    if (indice < 0) return null;
    const atual = this.items[indice];
    const usuario = Usuario.create(
      {
        email: atual.email,
        senhaHash: atual.senhaHash,
        papel: atual.papel,
        podeEditar,
        podeExportar,
      },
      atual.id,
    );
    this.items[indice] = usuario;
    return usuario;
  }
  async buscarPorId(id: string) {
    return this.items.find((u) => u.id.toString() === id) ?? null;
  }
  async buscarPorEmail(email: string) {
    return this.items.find((u) => u.email === email) ?? null;
  }
  async criarSeEmailDisponivel(usuario: Usuario) {
    if (this.items.some((item) => item.email === usuario.email)) return false;
    this.items.push(usuario);
    return true;
  }
}

describe('cadastro de usuário (HTTP)', () => {
  let app: INestApplication;
  let repo: UsuariosEmMemoria;
  let token: string;
  let admin: Usuario;
  beforeEach(async () => {
    repo = new UsuariosEmMemoria();
    admin = Usuario.create(
      {
        email: 'admin@example.test',
        senhaHash: 'hash',
        papel: 'ADMINISTRADOR',
        podeEditar: true,
        podeExportar: true,
      },
      new UniqueEntityID('48a9971c-8d30-487c-9daa-54b21e214d91'),
    );
    repo.items.push(admin);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ checkConnection: async () => undefined })
      .overrideProvider(UsuariosRepository)
      .useValue(repo)
      .compile();
    app = module.createNestApplication();
    await app.init();
    token = await module
      .get(JwtService)
      .signAsync({ sub: admin.id.toString() });
  });
  afterEach(async () => {
    await app.close();
  });
  const payload = {
    email: 'NOVO@example.test',
    senha: 'senha-segura',
    podeEditar: true,
    podeExportar: false,
  };

  it('cadastra um usuário com permissões independentes sem expor a senha', async () => {
    const response = await request(app.getHttpServer())
      .post('/usuarios')
      .auth(token, { type: 'bearer' })
      .send(payload)
      .expect(201);
    expect(response.body).toMatchObject({
      email: 'novo@example.test',
      papel: 'USUARIO',
      podeEditar: true,
      podeExportar: false,
    });
    expect(response.body).not.toHaveProperty('senhaHash');
    expect(repo.items[1].senhaHash).not.toBe(payload.senha);
    const listagem = await request(app.getHttpServer())
      .get('/usuarios')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(listagem.body.usuarios).toHaveLength(2);
    expect(listagem.body.usuarios[1]).not.toHaveProperty('senhaHash');
    const alterado = await request(app.getHttpServer())
      .patch(`/usuarios/${repo.items[1].id.toString()}/permissoes`)
      .auth(token, { type: 'bearer' })
      .send({ podeEditar: false, podeExportar: true })
      .expect(200);
    expect(alterado.body).toMatchObject({
      podeEditar: false,
      podeExportar: true,
    });
    await request(app.getHttpServer())
      .patch(`/usuarios/${admin.id.toString()}/permissoes`)
      .auth(token, { type: 'bearer' })
      .send({ podeEditar: false, podeExportar: false })
      .expect(404);
  });
  it('rejeita e-mail já cadastrado e senha curta', async () => {
    await request(app.getHttpServer())
      .post('/usuarios')
      .auth(token, { type: 'bearer' })
      .send({ ...payload, email: admin.email })
      .expect(409);
    await request(app.getHttpServer())
      .post('/usuarios')
      .auth(token, { type: 'bearer' })
      .send({ ...payload, senha: 'curta' })
      .expect(400);
    expect(repo.items).toHaveLength(1);
  });
  it('não permite cadastro por usuário comum', async () => {
    repo.items[0] = Usuario.create(
      {
        email: admin.email,
        senhaHash: 'hash',
        papel: 'USUARIO',
        podeEditar: true,
        podeExportar: true,
      },
      admin.id,
    );
    await request(app.getHttpServer())
      .post('/usuarios')
      .auth(token, { type: 'bearer' })
      .send(payload)
      .expect(403);
    expect(repo.items).toHaveLength(1);
  });
});
