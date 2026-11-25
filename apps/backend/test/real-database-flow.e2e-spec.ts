import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/infra/app.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
import { BcryptHasher } from '../src/infra/cryptography/bcrypt-hasher.ts';

const describeDatabase =
  process.env.TEST_REAL_DATABASE === '1' ? describe : describe.skip;

describeDatabase('fluxo com banco real', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let idRelatorio: string | undefined;
  let machineId: string | undefined;
  const userId = randomUUID();
  const email = `${userId}@example.test`;
  const senha = randomUUID();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = module.get(PrismaService);
    await prisma.user.create({
      data: {
        id: userId,
        email,
        passwordHash: await new BcryptHasher().hash(senha),
        role: 'USUARIO',
        canEdit: true,
        canExport: true,
      },
    });
  });

  afterAll(async () => {
    if (idRelatorio)
      await prisma.sequencingReport.deleteMany({
        where: { id: idRelatorio },
      });
    if (prisma) await prisma.user.deleteMany({ where: { id: userId } });
    if (prisma && machineId)
      await prisma.machine.deleteMany({ where: { id: machineId } });
    if (app) await app.close();
  });

  it('autentica, importa, salva e exporta com PostgreSQL real', async () => {
    const login = await request(app.getHttpServer())
      .post('/sessions')
      .send({ email, senha })
      .expect(200);
    const token = login.body.token as string;
    const machine = await request(app.getHttpServer())
      .post('/maquinas')
      .auth(token, { type: 'bearer' })
      .send({ name: 'Furadeira de teste', pdfTitle: `PDF ${userId}` })
      .expect(201);
    machineId = machine.body.id as string;
    const pdf = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    const importacao = await request(app.getHttpServer())
      .post('/relatorios/importar')
      .auth(token, { type: 'bearer' })
      .field('machineId', machineId)
      .attach('arquivo', pdf, 'teste.pdf')
      .expect(201);
    idRelatorio = importacao.body.id as string;
    const salvo = await request(app.getHttpServer())
      .patch(`/relatorios/${idRelatorio}/linhas/0`)
      .auth(token, { type: 'bearer' })
      .send({
        versaoEsperada: 1,
        necessaria: 390,
        realizada: 20,
        tempoUnitarioSegundos: 40,
        tempoSetupSegundos: 40,
      })
      .expect(200);
    expect(salvo.body.conteudo.resumos.total.saldo).toBe(3220);
    expect(
      (
        await prisma.sequencingReport.findUniqueOrThrow({
          where: { id: idRelatorio },
        })
      ).version,
    ).toBe(2);
    await request(app.getHttpServer())
      .patch(`/relatorios/${idRelatorio}/maquina`)
      .auth(token, { type: 'bearer' })
      .send({ machineId: null, expectedVersion: 2 })
      .expect(200);
    const unlinked = await prisma.sequencingReport.findUniqueOrThrow({
      where: { id: idRelatorio },
    });
    expect(unlinked.version).toBe(3);
    expect(unlinked.content).toMatchObject({ machineId: null });
    await request(app.getHttpServer())
      .get(`/relatorios/${idRelatorio}/exportar`)
      .auth(token, { type: 'bearer' })
      .expect(409);
  }, 30000);
});
