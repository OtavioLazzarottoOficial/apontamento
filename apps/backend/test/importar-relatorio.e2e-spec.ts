import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../src/core/entities/unique-entity-id.ts';
import { UsuariosRepository } from '../src/domain/auth/application/repositories/usuarios-repository.ts';
import { Usuario } from '../src/domain/auth/enterprise/usuario.ts';
import { RelatoriosRepository } from '../src/domain/sequenciamento/application/repositories/relatorios-repository.ts';
import { AppModule } from '../src/infra/app.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
import { RelatoriosRepositoryInMemory } from './repositories-in-memory/relatorios-repository-in-memory.ts';

describe('importação de relatório (HTTP)', () => {
  let app: INestApplication;
  let token: string;
  let usuario: Usuario;
  let repository: RelatoriosRepositoryInMemory;

  beforeEach(async () => {
    usuario = Usuario.create(
      {
        email: 'editor@example.test',
        senhaHash: 'hash',
        papel: 'USUARIO',
        podeEditar: true,
        podeExportar: false,
      },
      new UniqueEntityID('cc070f93-4219-4ea6-a4dd-ce250e4d2c3a'),
    );
    repository = new RelatoriosRepositoryInMemory();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ checkConnection: async () => undefined })
      .overrideProvider(UsuariosRepository)
      .useValue({ buscarPorId: async () => usuario })
      .overrideProvider(RelatoriosRepository)
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
    expect(repository.items[0].conteudo.paginas).toHaveLength(5);
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
    expect(repository.items[0].versao).toBe(3);
    await request(app.getHttpServer())
      .get(`/relatorios/${response.body.id}/exportar`)
      .auth(token, { type: 'bearer' })
      .expect(403);
    usuario = Usuario.create(
      {
        email: usuario.email,
        senhaHash: usuario.senhaHash,
        papel: 'USUARIO',
        podeEditar: true,
        podeExportar: true,
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
    usuario = Usuario.create({
      email: 'leitor@example.test',
      senhaHash: 'hash',
      papel: 'USUARIO',
      podeEditar: false,
      podeExportar: false,
    });
    await request(app.getHttpServer())
      .post('/relatorios/importar')
      .auth(token, { type: 'bearer' })
      .expect(403);
    expect(repository.items).toHaveLength(0);
  });

  it('rejeita acesso sem autenticação', async () => {
    await request(app.getHttpServer()).post('/relatorios/importar').expect(401);
  });
});
