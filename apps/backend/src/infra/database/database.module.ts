import { UsuariosRepository } from '../../domain/auth/application/repositories/usuarios-repository.ts';
import { PrismaUsuariosRepository } from './prisma/repositories/prisma-usuarios-repository.ts';
import { Module } from '@nestjs/common';
import { RelatoriosRepository } from '../../domain/sequenciamento/application/repositories/relatorios-repository.ts';
import { EnvModule } from '../env/env.module.ts';
import { PrismaService } from './prisma/prisma.service.ts';
import { PrismaRelatoriosRepository } from './prisma/repositories/prisma-relatorios-repository.ts';

@Module({
  imports: [EnvModule],
  providers: [
    { provide: UsuariosRepository, useClass: PrismaUsuariosRepository },
    PrismaService,
    { provide: RelatoriosRepository, useClass: PrismaRelatoriosRepository },
  ],
  exports: [PrismaService, RelatoriosRepository, UsuariosRepository],
})
export class DatabaseModule {}
