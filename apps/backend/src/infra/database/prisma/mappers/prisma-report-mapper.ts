import { UniqueEntityID } from '../../../../core/entities/unique-entity-id.ts';
import { ReportSnapshot } from '../../../../domain/sequencing/application/models/report-snapshot.ts';
import {
  LegacyReportDocument,
  type LegacyReportValue,
} from '../../../pdf/legacy-report-document.ts';
import { InvalidStoredReportError } from '../../../errors/invalid-stored-report-error.ts';
import type { Prisma, SequencingReport } from '../generated/client.ts';

export class PrismaReportMapper {
  static toDomain(raw: SequencingReport): ReportSnapshot {
    if (
      raw.content === null ||
      Array.isArray(raw.content) ||
      typeof raw.content !== 'object' ||
      !Number.isInteger(raw.version) ||
      raw.version < 1
    ) {
      throw new InvalidStoredReportError();
    }

    return ReportSnapshot.create(
      {
        content: new LegacyReportDocument(
          raw.content as { [key: string]: LegacyReportValue },
        ),
        version: raw.version,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(report: ReportSnapshot): Prisma.InputJsonObject {
    return LegacyReportDocument.dataOf(
      report.content,
    ) as Prisma.InputJsonObject;
  }
}
