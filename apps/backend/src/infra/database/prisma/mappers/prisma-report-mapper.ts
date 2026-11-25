import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';
import {
  Report,
  type ReportValue,
} from '../../../../domain/sequencing/enterprise/report.ts';
import { InvalidStoredReportError } from '../../../errors/invalid-stored-report-error.ts';
import type { Prisma, SequencingReport } from '../generated/client.ts';

export class PrismaReportMapper {
  static toDomain(raw: SequencingReport): Report {
    if (
      raw.content === null ||
      Array.isArray(raw.content) ||
      typeof raw.content !== 'object' ||
      !Number.isInteger(raw.version) ||
      raw.version < 1
    ) {
      throw new InvalidStoredReportError();
    }

    return Report.create(
      {
        content: raw.content as { [key: string]: ReportValue },
        version: raw.version,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(relatorio: Report): Prisma.InputJsonObject {
    return relatorio.content as Prisma.InputJsonObject;
  }
}
