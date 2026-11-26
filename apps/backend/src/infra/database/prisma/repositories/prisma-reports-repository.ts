import { PrismaReportSummaryMapper } from '../mappers/prisma-report-summary-mapper.ts';
import { Injectable } from '@nestjs/common';
import { ReportsRepository } from '../../../../domain/sequencing/application/repositories/reports-repository.ts';
import type { ReportSnapshot } from '../../../../domain/sequencing/application/models/report-snapshot.ts';
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
    return rows.map((row) => PrismaReportSummaryMapper.toDomain(row));
  }

  async deleteIfVersionMatches(id: string, expectedVersion: number) {
    const result = await this.prisma.sequencingReport.deleteMany({
      where: { id, version: expectedVersion },
    });
    return result.count === 1;
  }

  async create(report: ReportSnapshot) {
    await this.prisma.sequencingReport.create({
      data: {
        id: report.id.toString(),
        version: report.version,
        content: PrismaReportMapper.toPrisma(report),
      },
    });
  }

  async findById(id: string) {
    const record = await this.prisma.sequencingReport.findUnique({
      where: { id },
    });
    return record ? PrismaReportMapper.toDomain(record) : null;
  }

  async updateIfVersionMatches(
    report: ReportSnapshot,
    expectedVersion: number,
  ) {
    const result = await this.prisma.sequencingReport.updateMany({
      where: { id: report.id.toString(), version: expectedVersion },
      data: {
        content: PrismaReportMapper.toPrisma(report),
        version: report.version,
      },
    });

    return result.count === 1;
  }
}
