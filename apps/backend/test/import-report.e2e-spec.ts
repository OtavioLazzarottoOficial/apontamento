import { MachinesRepository } from '../src/domain/production/application/repositories/machines-repository.ts';
import { Machine } from '../src/domain/production/enterprise/machine.ts';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../src/core/entities/unique-entity-id.ts';
import { UsersRepository } from '../src/domain/auth/application/repositories/users-repository.ts';
import { User } from '../src/domain/auth/enterprise/user.ts';
import { ReportsRepository } from '../src/domain/sequencing/application/repositories/reports-repository.ts';
import { Report } from '../src/domain/sequencing/enterprise/report.ts';
import { AppModule } from '../src/infra/app.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
import { InMemoryReportsRepository } from './repositories-in-memory/in-memory-reports-repository.ts';

describe('importação de relatório (HTTP)', () => {
  let app: INestApplication;
  let token: string;
  let usuario: User;
  let repository: InMemoryReportsRepository;

  beforeEach(async () => {
    usuario = User.create(
      {
        email: 'editor@example.test',
        passwordHash: 'hash',
        role: 'USUARIO',
        canEdit: true,
        canExport: false,
      },
      new UniqueEntityID('cc070f93-4219-4ea6-a4dd-ce250e4d2c3a'),
    );
    repository = new InMemoryReportsRepository();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MachinesRepository)
      .useValue({
        list: async () => [
          Machine.create(
            {
              name: 'Furadeira',
              pdfTitle: 'PO Furadeira Nanxing Mod. NCB2412S B',
            },
            new UniqueEntityID('machine-1'),
          ),
        ],
      })
      .overrideProvider(PrismaService)
      .useValue({ checkConnection: async () => undefined })
      .overrideProvider(UsersRepository)
      .useValue({ findById: async () => usuario })
      .overrideProvider(ReportsRepository)
      .useValue(repository)
      .compile();
    app = module.createNestApplication();
    await app.init();
    token = await module
      .get(JwtService)
      .signAsync({ sub: usuario.id.toString() });
  });

  afterEach(async () => {
    await app.close();
  });

  it('exige selecionar uma máquina cadastrada antes da importação', async () => {
    const pdf = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    await request(app.getHttpServer())
      .post('/relatorios/importar')
      .auth(token, { type: 'bearer' })
      .attach('arquivo', pdf, 'mapa.pdf')
      .expect(400);
    await request(app.getHttpServer())
      .post('/relatorios/importar')
      .auth(token, { type: 'bearer' })
      .field('machineId', 'inexistente')
      .attach('arquivo', pdf, 'mapa.pdf')
      .expect(400);
    expect(repository.items).toHaveLength(0);
  });

  it('importa as páginas do PDF autorizado', async () => {
    const pdf = await readFile(
      resolve(
        process.cwd(),
        '../../PO Furadeira Nanxing Mod. NCB2412S B (2).pdf',
      ),
    );
    const response = await request(app.getHttpServer())
      .post('/relatorios/importar')
      .auth(token, { type: 'bearer' })
      .field('machineId', 'machine-1')
      .attach('arquivo', pdf, 'sequenciamento.pdf')
      .expect(201);
    expect(response.body.versao).toBe(1);
    expect(repository.items).toHaveLength(1);
    const lista = await request(app.getHttpServer())
      .get('/relatorios')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(lista.body.relatorios).toEqual([
      expect.objectContaining({
        id: response.body.id,
        nome: 'sequenciamento.pdf',
        versao: 1,
      }),
    ]);
    expect(repository.items[0].content.paginas).toHaveLength(5);
    expect(repository.items[0].content.machineId).toBe('machine-1');
    const leitura = await request(app.getHttpServer())
      .get(`/relatorios/${response.body.id}`)
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(leitura.body.conteudo.paginas).toHaveLength(5);
    expect(leitura.body.conteudo).not.toHaveProperty('pdfBase64');
    const alteracao = {
      versaoEsperada: 1,
      necessaria: 390,
      realizada: 20,
      tempoUnitarioSegundos: 40,
      tempoSetupSegundos: 40,
    };
    const salvo = await request(app.getHttpServer())
      .patch(`/relatorios/${response.body.id}/linhas/0`)
      .auth(token, { type: 'bearer' })
      .send(alteracao)
      .expect(200);
    expect(salvo.body.versao).toBe(2);
    expect(salvo.body.conteudo).not.toHaveProperty('pdfBase64');
    expect(salvo.body.conteudo.linhas[0].saldo).toBe(370);
    expect(salvo.body.conteudo.resumos.total.realizada).toBe(20);
    const referenciaTexto =
      salvo.body.conteudo.linhas[0].camposTexto.componente[0];
    const textoEditado = await request(app.getHttpServer())
      .patch(`/relatorios/${response.body.id}/texto`)
      .auth(token, { type: 'bearer' })
      .send({
        versaoEsperada: 2,
        ...referenciaTexto,
        texto: 'Componente editado',
      })
      .expect(200);
    expect(textoEditado.body.versao).toBe(3);
    const original = await request(app.getHttpServer())
      .get(`/relatorios/${response.body.id}/original`)
      .auth(token, { type: 'bearer' })
      .buffer(true)
      .parse((stream, callback) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => callback(null, Buffer.concat(chunks)));
        stream.on('error', callback);
      })
      .expect('Content-Type', /application\/pdf/)
      .expect('Cache-Control', 'private, no-store')
      .expect(200);
    expect(original.body).toEqual(pdf);
    expect(
      textoEditado.body.conteudo.paginas[referenciaTexto.pagina - 1].trechos[
        referenciaTexto.indice
      ].texto,
    ).toBe('Componente editado');
    const referenciaCalculada = salvo.body.conteudo.linhas[0].campos.saldo;
    await request(app.getHttpServer())
      .patch(`/relatorios/${response.body.id}/texto`)
      .auth(token, { type: 'bearer' })
      .send({ versaoEsperada: 3, ...referenciaCalculada, texto: '999' })
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/relatorios/${response.body.id}/linhas/0`)
      .auth(token, { type: 'bearer' })
      .send(alteracao)
      .expect(409);
    expect(repository.items[0].version).toBe(3);
    await request(app.getHttpServer())
      .get(`/relatorios/${response.body.id}/exportar`)
      .auth(token, { type: 'bearer' })
      .expect(403);
    usuario = User.create(
      {
        email: usuario.email,
        passwordHash: usuario.passwordHash,
        role: 'USUARIO',
        canEdit: true,
        canExport: true,
      },
      usuario.id,
    );
    await request(app.getHttpServer())
      .get(`/relatorios/${response.body.id}/exportar`)
      .auth(token, { type: 'bearer' })
      .expect(409);
    const preview = await request(app.getHttpServer())
      .get(`/relatorios/${response.body.id}/preview`)
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(preview.body.paginas).toHaveLength(5);
    expect(
      Buffer.from(preview.body.paginas[0], 'base64').subarray(0, 8),
    ).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }, 30000);

  it('rejeita usuário sem permissão antes de importar', async () => {
    usuario = User.create({
      email: 'leitor@example.test',
      passwordHash: 'hash',
      role: 'USUARIO',
      canEdit: false,
      canExport: false,
    });
    await request(app.getHttpServer())
      .post('/relatorios/importar')
      .auth(token, { type: 'bearer' })
      .expect(403);
    expect(repository.items).toHaveLength(0);
  });

  it('rejeita acesso sem autenticação', async () => {
    await request(app.getHttpServer()).post('/relatorios/importar').expect(401);
    await request(app.getHttpServer())
      .get('/relatorios/qualquer/original')
      .expect(401);
  });

  it('retorna 404 para relatório ausente ou sem PDF original', async () => {
    await request(app.getHttpServer())
      .get('/relatorios/inexistente/original')
      .auth(token, { type: 'bearer' })
      .expect(404);
    const report = Report.create({ content: { nome: 'Sem PDF' }, version: 1 });
    repository.items.push(report);
    await request(app.getHttpServer())
      .get(`/relatorios/${report.id.toString()}/original`)
      .auth(token, { type: 'bearer' })
      .expect(404);
  });
});
