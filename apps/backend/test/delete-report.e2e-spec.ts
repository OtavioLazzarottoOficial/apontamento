import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../src/core/entities/unique-entity-id.ts';
import { User } from '../src/domain/auth/enterprise/user.ts';
import { UsersRepository } from '../src/domain/auth/application/repositories/users-repository.ts';
import { ReportsRepository } from '../src/domain/sequencing/application/repositories/reports-repository.ts';
import { Report } from '../src/domain/sequencing/enterprise/report.ts';
import { AppModule } from '../src/infra/app.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';
import { InMemoryReportsRepository } from './repositories-in-memory/in-memory-reports-repository.ts';
describe('delete shared reports (HTTP)', () => {
  let app: INestApplication;
  let token: string;
  let user: User;
  let reports: InMemoryReportsRepository;
  let report: Report;
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
    report = Report.create({
      content: {
        nome: 'Sequenciamento',
        machineId: 'machine-1',
        linhas: [
          { dataEntrega: '12/11/2026', area: 10.25 },
          { dataEntrega: '12/11/2026', area: 5 },
          { dataEntrega: '13/11/2026', area: 7 },
        ],
      },
      version: 2,
    });
    reports.items.push(report);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ checkConnection: async () => undefined })
      .overrideProvider(UsersRepository)
      .useValue({ findById: async () => user })
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
  it('returns compact machine and date summaries', async () => {
    const result = await request(app.getHttpServer())
      .get('/relatorios')
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(result.body.relatorios[0]).toMatchObject({
      machineId: 'machine-1',
      dailyAreas: [
        { date: '12/11/2026', area: 15.25 },
        { date: '13/11/2026', area: 7 },
      ],
    });
  });
  it('protects deletion, rejects stale versions and deletes only the selected report', async () => {
    const server = app.getHttpServer();
    const url = `/relatorios/${report.id.toString()}`;
    await request(server).delete(url).send({ expectedVersion: 2 }).expect(401);
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
      .delete(url)
      .auth(token, { type: 'bearer' })
      .send({ expectedVersion: 2 })
      .expect(403);
    user = User.create(
      {
        email: user.email,
        passwordHash: user.passwordHash,
        role: 'USUARIO',
        canEdit: true,
        canExport: false,
      },
      user.id,
    );
    await request(server)
      .delete(url)
      .auth(token, { type: 'bearer' })
      .send({ expectedVersion: 0 })
      .expect(400);
    await request(server)
      .delete(url)
      .auth(token, { type: 'bearer' })
      .send({ expectedVersion: 1 })
      .expect(409);
    expect(reports.items).toHaveLength(1);
    await request(server)
      .delete(url)
      .auth(token, { type: 'bearer' })
      .send({ expectedVersion: 2 })
      .expect(204);
    expect(reports.items).toHaveLength(0);
    await request(server)
      .delete(url)
      .auth(token, { type: 'bearer' })
      .send({ expectedVersion: 2 })
      .expect(404);
  });
});
