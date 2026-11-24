import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AdministradorGuard } from '../../auth/administrador.guard.ts';
import { UsuarioExistenteGuard } from '../../auth/usuario-existente.guard.ts';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe.ts';

const schema = z.object({ eficienciaPercentual: z.number().int().min(1).max(100) });

@Controller('/configuracao/capacidade')
@UseGuards(UsuarioExistenteGuard)
export class ConfiguracaoCapacidadeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async obter() {
    const configuracao = await this.prisma.configuracaoCapacidade.findUnique({ where: { id: 1 } });
    return { eficienciaPercentual: configuracao?.eficienciaPercentual ?? 80 };
  }

  @Put()
  @UseGuards(AdministradorGuard)
  async alterar(@Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>) {
    const configuracao = await this.prisma.configuracaoCapacidade.upsert({
      where: { id: 1 },
      create: { id: 1, ...body },
      update: body,
    });
    return { eficienciaPercentual: configuracao.eficienciaPercentual };
  }
}

