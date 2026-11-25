import { summarizeReport } from '../../../../domain/sequencing/application/services/summarize-report.ts';
import { Injectable } from '@nestjs/common';
import { ReportsRepository } from '../../../../domain/sequencing/application/repositories/reports-repository.ts';
import type { Report } from '../../../../domain/sequencing/enterprise/report.ts';
import { PrismaReportMapper } from '../mappers/prisma-report-mapper.ts';
import { PrismaService } from '../prisma.service.ts';

@Injectable()
export class PrismaReportsRepository extends ReportsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list() {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        versao: number;
        nome: string | null;
        machine_id: string | null;
        linhas: unknown;
      }[]
    >`
      SELECT id, versao, conteudo->>'nome' AS nome, conteudo->>'machineId' AS machine_id, conteudo->'linhas' AS linhas
      FROM relatorios_sequenciamento ORDER BY id
    `;
    return rows.map((row) =>
      summarizeReport(row.id, row.versao, row.nome, row.machine_id, row.linhas),
    );
  }

  async deleteIfVersionMatches(id: string, expectedVersion: number) {
    const result = await this.prisma.sequencingReport.deleteMany({
      where: { id, version: expectedVersion },
    });
    return result.count === 1;
  }

  async create(relatorio: Report) {
    await this.prisma.sequencingReport.create({
      data: {
        id: relatorio.id.toString(),
        version: relatorio.version,
        content: PrismaReportMapper.toPrisma(relatorio),
      },
    });
  }

  async findById(id: string) {
    const registro = await this.prisma.sequencingReport.findUnique({
      where: { id },
    });
    return registro ? PrismaReportMapper.toDomain(registro) : null;
  }

  async updateIfVersionMatches(relatorio: Report, versaoEsperada: number) {
    const resultado = await this.prisma.sequencingReport.updateMany({
      where: { id: relatorio.id.toString(), version: versaoEsperada },
      data: {
        content: PrismaReportMapper.toPrisma(relatorio),
        version: relatorio.version,
      },
    });

    return resultado.count === 1;
  }
}
