import {
  summarizeReport,
  type ReportAreaLine,
} from '../../../../domain/sequencing/application/services/summarize-report.ts';

export class PrismaReportSummaryMapper {
  static toDomain(raw: {
    id: string;
    versao: number;
    nome: string | null;
    machine_id: string | null;
    linhas: unknown;
  }) {
    const lines: ReportAreaLine[] = [];
    if (Array.isArray(raw.linhas)) {
      for (const line of raw.linhas) {
        if (
          typeof line !== 'object' ||
          line === null ||
          typeof line.area !== 'number' ||
          !Number.isFinite(line.area)
        )
          continue;
        lines.push({
          deliveryDate:
            typeof line.dataEntrega === 'string' ? line.dataEntrega : '',
          area: line.area,
        });
      }
    }
    return summarizeReport(
      raw.id,
      raw.versao,
      raw.nome ?? '',
      raw.machine_id,
      lines,
    );
  }
}
