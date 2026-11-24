import { Injectable } from '@nestjs/common';
import { RelatoriosRepository } from '../../../../domain/sequenciamento/application/repositories/relatorios-repository.ts';
import type { Relatorio } from '../../../../domain/sequenciamento/enterprise/relatorio.ts';
import { PrismaRelatorioMapper } from '../mappers/prisma-relatorio-mapper.ts';
import { PrismaService } from '../prisma.service.ts';

@Injectable()
export class PrismaRelatoriosRepository extends RelatoriosRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listar() {
    const registros = await this.prisma.$queryRaw<
      { id: string; versao: number; nome: string | null }[]
    >`
      SELECT id, versao, conteudo->>'nome' AS nome
      FROM relatorios_sequenciamento ORDER BY id
    `;
    return registros.map((item) => ({ ...item, nome: item.nome ?? '' }));
  }

  async criar(relatorio: Relatorio) {
    await this.prisma.relatorioSequenciamento.create({
      data: {
        id: relatorio.id.toString(),
        versao: relatorio.versao,
        conteudo: PrismaRelatorioMapper.toPrisma(relatorio),
      },
    });
  }

  async buscarPorId(id: string) {
    const registro = await this.prisma.relatorioSequenciamento.findUnique({
      where: { id },
    });
    return registro ? PrismaRelatorioMapper.toDomain(registro) : null;
  }

  async atualizarSeVersaoCorresponde(
    relatorio: Relatorio,
    versaoEsperada: number,
  ) {
    const resultado = await this.prisma.relatorioSequenciamento.updateMany({
      where: { id: relatorio.id.toString(), versao: versaoEsperada },
      data: {
        conteudo: PrismaRelatorioMapper.toPrisma(relatorio),
        versao: relatorio.versao,
      },
    });

    return resultado.count === 1;
  }
}
