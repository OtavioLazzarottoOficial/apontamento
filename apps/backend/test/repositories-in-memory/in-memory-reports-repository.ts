import { readTestReportData } from '../services-in-memory/in-memory-report-document.ts';
import { summarizeReport } from '../../src/domain/sequencing/application/services/summarize-report.ts';
import { ReportsRepository } from '../../src/domain/sequencing/application/repositories/reports-repository.ts';
import type { ReportSnapshot } from '../../src/domain/sequencing/application/models/report-snapshot.ts';

export class InMemoryReportsRepository extends ReportsRepository {
  items: ReportSnapshot[] = [];

  async list() {
    return this.items.map((item) => {
      const content = readTestReportData(item.content);
      const raw = content.linhas;
      const lines = Array.isArray(raw)
        ? raw.flatMap((line) => {
            if (
              !line ||
              typeof line !== 'object' ||
              Array.isArray(line) ||
              typeof line.area !== 'number' ||
              !Number.isFinite(line.area)
            )
              return [];
            return [
              {
                deliveryDate:
                  typeof line.dataEntrega === 'string' ? line.dataEntrega : '',
                area: line.area,
              },
            ];
          })
        : [];
      return summarizeReport(
        item.id.toString(),
        item.version,
        typeof content.nome === 'string' ? content.nome : '',
        typeof content.machineId === 'string' ? content.machineId : null,
        lines,
      );
    });
  }

  async deleteIfVersionMatches(id: string, expectedVersion: number) {
    const index = this.items.findIndex(
      (item) => item.id.toString() === id && item.version === expectedVersion,
    );
    if (index < 0) return false;
    this.items.splice(index, 1);
    return true;
  }

  async create(relatorio: ReportSnapshot) {
    this.items.push(relatorio);
  }

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null;
  }

  async updateIfVersionMatches(
    relatorio: ReportSnapshot,
    versaoEsperada: number,
  ) {
    const index = this.items.findIndex(
      (item) => item.id.equals(relatorio.id) && item.version === versaoEsperada,
    );

    if (index < 0) {
      return false;
    }

    this.items[index] = relatorio;
    return true;
  }
}
