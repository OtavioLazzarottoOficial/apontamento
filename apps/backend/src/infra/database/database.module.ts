import { MachinesRepository } from '../../domain/production/application/repositories/machines-repository.ts';
import { PrismaMachinesRepository } from './prisma/repositories/prisma-machines-repository.ts';
import { UsersRepository } from '../../domain/auth/application/repositories/users-repository.ts';
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository.ts';
import { Module } from '@nestjs/common';
import { ReportsRepository } from '../../domain/sequencing/application/repositories/reports-repository.ts';
import { EnvModule } from '../env/env.module.ts';
import { PrismaService } from './prisma/prisma.service.ts';
import { PrismaReportsRepository } from './prisma/repositories/prisma-reports-repository.ts';
import { CapacityConfigurationsRepository } from '../../domain/production/application/repositories/capacity-configurations-repository.ts';
import { PrismaCapacityConfigurationsRepository } from './prisma/repositories/prisma-capacity-configurations-repository.ts';

@Module({
  imports: [EnvModule],
  providers: [
    { provide: MachinesRepository, useClass: PrismaMachinesRepository },
    {
      provide: CapacityConfigurationsRepository,
      useClass: PrismaCapacityConfigurationsRepository,
    },
    { provide: UsersRepository, useClass: PrismaUsersRepository },
    PrismaService,
    { provide: ReportsRepository, useClass: PrismaReportsRepository },
  ],
  exports: [
    MachinesRepository,
    PrismaService,
    ReportsRepository,
    UsersRepository,
    CapacityConfigurationsRepository,
  ],
})
export class DatabaseModule {}
