import { summarizeReport } from '../../src/domain/sequencing/application/services/summarize-report.ts';
import { ReportsRepository } from '../../src/domain/sequencing/application/repositories/reports-repository.ts';
import type { Report } from '../../src/domain/sequencing/enterprise/report.ts';

export class InMemoryReportsRepository extends ReportsRepository {
  items: Report[] = [];

  async list() {
    return this.items.map((item) =>
      summarizeReport(
        item.id.toString(),
        item.version,
        item.content.nome,
        item.content.machineId,
        item.content.linhas,
      ),
    );
  }

  async deleteIfVersionMatches(id: string, expectedVersion: number) {
    const index = this.items.findIndex(
      (item) => item.id.toString() === id && item.version === expectedVersion,
    );
    if (index < 0) return false;
    this.items.splice(index, 1);
    return true;
  }

  async create(relatorio: Report) {
    this.items.push(relatorio);
  }

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null;
  }

  async updateIfVersionMatches(relatorio: Report, versaoEsperada: number) {
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
