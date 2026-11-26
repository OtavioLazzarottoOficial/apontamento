import ExcelJS from 'exceljs';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../src/core/entities/unique-entity-id.ts';
import { UsersRepository } from '../src/domain/auth/application/repositories/users-repository.ts';
import { User } from '../src/domain/auth/enterprise/user.ts';
import { AppModule } from '../src/infra/app.module.ts';
import { PrismaService } from '../src/infra/database/prisma/prisma.service.ts';

describe('prévia da planilha de prazos (HTTP)', () => {
  let app: INestApplication;
  let token: string;
  let user: User;
  let spreadsheet: Buffer;
  beforeEach(async () => {
    user = User.create(
      {
        email: 'editor@example.test',
        passwordHash: 'hash',
        role: 'USER',
        canEdit: true,
        canExport: false,
      },
      new UniqueEntityID('cc070f93-4219-4ea6-a4dd-ce250e4d2c3a'),
    );
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ checkConnection: async () => undefined })
      .overrideProvider(UsersRepository)
      .useValue({ findById: async () => user })
      .compile();
    app = module.createNestApplication();
    await app.init();
    token = await module.get(JwtService).signAsync({ sub: user.id.toString() });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Plano');
    sheet.addRow(['Lote', 'Usi']);
    sheet.addRow(['1110', '26/nov']);
    spreadsheet = Buffer.from(await workbook.xlsx.writeBuffer());
  });
  afterEach(async () => {
    await app.close();
  });
  it('exige autenticação e permissão e lê a planilha sem persistir', async () => {
    await request(app.getHttpServer())
      .post('/prazos/planilha/preview')
      .field('ano', '2026')
      .attach('arquivo', spreadsheet, 'plano.xlsx')
      .expect(401);
    const response = await request(app.getHttpServer())
      .post('/prazos/planilha/preview')
      .auth(token, { type: 'bearer' })
      .field('ano', '2026')
      .attach('arquivo', spreadsheet, 'plano.xlsx')
      .expect(201);
    expect(response.body.rows).toEqual([
      { row: 2, batch: '1110', rawDeadline: '26/nov', deadline: '2026-11-26' },
    ]);
    user = User.create(
      {
        email: 'reader@example.test',
        passwordHash: 'hash',
        role: 'USER',
        canEdit: false,
        canExport: false,
      },
      user.id,
    );
    await request(app.getHttpServer())
      .post('/prazos/planilha/preview')
      .auth(token, { type: 'bearer' })
      .field('ano', '2026')
      .attach('arquivo', spreadsheet, 'plano.xlsx')
      .expect(403);
  });
});
