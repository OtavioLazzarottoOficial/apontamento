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

describe('configuração de capacidade (HTTP)', () => {
  let app: INestApplication;
  let adminToken: string;
  let usuarioToken: string;
  let valor: number | null;
  beforeEach(async () => {
    valor = null;
    const admin = Usuario.create({ email: 'admin@example.test', senhaHash: 'hash', papel: 'ADMINISTRADOR', podeEditar: true, podeExportar: true }, new UniqueEntityID('48a9971c-8d30-487c-9daa-54b21e214d91'));
    const usuario = Usuario.create({ email: 'usuario@example.test', senhaHash: 'hash', papel: 'USUARIO', podeEditar: true, podeExportar: false }, new UniqueEntityID('9df005f9-ac31-4f74-9461-1a2474178834'));
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(UsuariosRepository).useValue({ buscarPorId: async (id: string) => [admin, usuario].find((u) => u.id.toString() === id) ?? null })
      .overrideProvider(PrismaService).useValue({ configuracaoCapacidade: {
        findUnique: async () => valor === null ? null : { eficienciaPercentual: valor },
        upsert: async ({ update }: { update: { eficienciaPercentual: number } }) => { valor = update.eficienciaPercentual; return { eficienciaPercentual: valor }; },
      } }).compile();
    app = module.createNestApplication();
    await app.init();
    adminToken = await module.get(JwtService).signAsync({ sub: admin.id.toString() });
    usuarioToken = await module.get(JwtService).signAsync({ sub: usuario.id.toString() });
  });
  afterEach(async () => { await app.close(); });
  it('oferece padrão, restringe alteração e compartilha valor salvo', async () => {
    await request(app.getHttpServer()).get('/configuracao/capacidade').expect(401);
    const padrao = await request(app.getHttpServer()).get('/configuracao/capacidade').auth(usuarioToken, { type: 'bearer' }).expect(200);
    expect(padrao.body.eficienciaPercentual).toBe(80);
    await request(app.getHttpServer()).put('/configuracao/capacidade').auth(usuarioToken, { type: 'bearer' }).send({ eficienciaPercentual: 85 }).expect(403);
    await request(app.getHttpServer()).put('/configuracao/capacidade').auth(adminToken, { type: 'bearer' }).send({ eficienciaPercentual: 101 }).expect(400);
    await request(app.getHttpServer()).put('/configuracao/capacidade').auth(adminToken, { type: 'bearer' }).send({ eficienciaPercentual: 85 }).expect(200);
    const atualizado = await request(app.getHttpServer()).get('/configuracao/capacidade').auth(usuarioToken, { type: 'bearer' }).expect(200);
    expect(atualizado.body.eficienciaPercentual).toBe(85);
  });
});
