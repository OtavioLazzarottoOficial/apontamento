import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../src/core/entities/unique-entity-id.ts';
import { User } from '../src/domain/auth/enterprise/user.ts';
import { UsersRepository } from '../src/domain/auth/application/repositories/users-repository.ts';
import { MachinesRepository } from '../src/domain/production/application/repositories/machines-repository.ts';
import type { Machine } from '../src/domain/production/enterprise/machine.ts';
import { ReportsRepository } from '../src/domain/sequencing/application/repositories/reports-repository.ts';
import { Report } from '../src/domain/sequencing/enterprise/report.ts';
import { InMemoryReportsRepository } from './repositories-in-memory/in-memory-reports-repository.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
import { AppModule } from '../src/infra/app.module.ts';
class MachinesInMemory extends MachinesRepository {
  items: Machine[] = [];
  async list() {
    return this.items;
  }
  async create(machine: Machine) {
    this.items.push(machine);
  }
  async update(machine: Machine) {
    this.items[this.items.findIndex((item) => item.id.equals(machine.id))] =
      machine;
  }
}
describe('machines HTTP', () => {
  let app: INestApplication;
  let token: string;
  let user: User;
  let reports: InMemoryReportsRepository;
  beforeEach(async () => {
    user = User.create(
      {
        email: 'editor@example.test',
        passwordHash: 'hash',
        role: 'USUARIO',
        canEdit: true,
        canExport: false,
      },
      new UniqueEntityID('cc070f93-4219-4ea6-a4dd-ce250e4d2c3a'),
    );
    reports = new InMemoryReportsRepository();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ checkConnection: async () => undefined })
      .overrideProvider(UsersRepository)
      .useValue({ findById: async () => user })
      .overrideProvider(MachinesRepository)
      .useValue(new MachinesInMemory())
      .overrideProvider(ReportsRepository)
      .useValue(reports)
      .compile();
    app = module.createNestApplication();
    await app.init();
    token = await module.get(JwtService).signAsync({ sub: user.id.toString() });
  });
  afterEach(async () => {
    await app.close();
  });
  it('registers and updates machines and associates legacy reports with version control', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post('/maquinas')
      .send({ name: 'M', pdfTitle: 'PDF' })
      .expect(401);
    await request(server)
      .post('/maquinas')
      .auth(token, { type: 'bearer' })
      .send({ name: '', pdfTitle: 'PDF' })
      .expect(400);
    const created = await request(server)
      .post('/maquinas')
      .auth(token, { type: 'bearer' })
      .send({ name: 'Furadeira', pdfTitle: 'PO Furadeira' })
      .expect(201);
    const namedMachine = await request(server)
      .post('/maquinas')
      .auth(token, { type: 'bearer' })
      .send({ name: 'Serra' })
      .expect(201);
    expect(namedMachine.body.name).toBe('Serra');
    await request(server)
      .post('/maquinas')
      .auth(token, { type: 'bearer' })
      .send({ name: 'Outra', pdfTitle: 'po furadeira' })
      .expect(409);
    await request(server)
      .patch(`/maquinas/${created.body.id}`)
      .auth(token, { type: 'bearer' })
      .send({ name: 'Furadeira manual', pdfTitle: 'PO Furadeira' })
      .expect(200);
    const list = await request(server)
      .get('/maquinas')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(list.body.machines[0].name).toBe('Furadeira manual');
    const report = Report.create({
      content: { nome: 'antigo.pdf' },
      version: 1,
    });
    reports.items.push(report);
    await request(server)
      .patch(`/relatorios/${report.id.toString()}/maquina`)
      .auth(token, { type: 'bearer' })
      .send({ machineId: created.body.id, expectedVersion: 1 })
      .expect(200);
    expect(reports.items[0].content.machineId).toBe(created.body.id);
    await request(server)
      .patch(`/relatorios/${report.id.toString()}/maquina`)
      .auth(token, { type: 'bearer' })
      .send({ machineId: created.body.id, expectedVersion: 1 })
      .expect(409);
    await request(server)
      .patch(`/relatorios/${report.id.toString()}/maquina`)
      .auth(token, { type: 'bearer' })
      .send({ machineId: null, expectedVersion: 1 })
      .expect(409);
    const unlinked = await request(server)
      .patch(`/relatorios/${report.id.toString()}/maquina`)
      .auth(token, { type: 'bearer' })
      .send({ machineId: null, expectedVersion: 2 })
      .expect(200);
    expect(unlinked.body.conteudo.machineId).toBeNull();
    expect(reports.items).toHaveLength(1);
    expect(reports.items[0].content.nome).toBe('antigo.pdf');
    user = User.create(
      {
        email: user.email,
        passwordHash: user.passwordHash,
        role: 'USUARIO',
        canEdit: false,
        canExport: false,
      },
      user.id,
    );
    await request(server)
      .post('/maquinas')
      .auth(token, { type: 'bearer' })
      .send({ name: 'M', pdfTitle: 'PDF' })
      .expect(403);
    await request(server)
      .patch(`/relatorios/${report.id.toString()}/maquina`)
      .auth(token, { type: 'bearer' })
      .send({ machineId: null, expectedVersion: 3 })
      .expect(403);
    await request(server)
      .get('/maquinas')
      .auth(token, { type: 'bearer' })
      .expect(200);
  });
});
