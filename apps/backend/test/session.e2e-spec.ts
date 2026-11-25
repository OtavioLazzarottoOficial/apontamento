import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/infra/app.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
import { UsersRepository } from '../src/domain/auth/application/repositories/users-repository.ts';
import { User } from '../src/domain/auth/enterprise/user.ts';
import { BcryptHasher } from '../src/infra/cryptography/bcrypt-hasher.ts';

describe('login (HTTP)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const hash = await new BcryptHasher().hash('senha-segura');
    const usuario = User.create({
      email: 'pessoa@example.test',
      passwordHash: hash,
      role: 'USUARIO',
      canEdit: false,
      canExport: false,
    });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ checkConnection: async () => undefined })
      .overrideProvider(UsersRepository)
      .useValue({
        findByEmail: async (email: string) =>
          email === usuario.email ? usuario : null,
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('emite token sem retornar o hash', async () => {
    const response = await request(app.getHttpServer())
      .post('/sessions')
      .send({ email: 'PESSOA@example.test', senha: 'senha-segura' })
      .expect(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body).toEqual({ token: response.body.token });
  });

  it('rejeita credenciais incorretas', async () => {
    await request(app.getHttpServer())
      .post('/sessions')
      .send({ email: 'pessoa@example.test', senha: 'incorreta' })
      .expect(401);
  });

  it('rejeita entrada inválida', async () => {
    await request(app.getHttpServer())
      .post('/sessions')
      .send({ email: 'invalido', senha: 'x' })
      .expect(400);
  });
});
