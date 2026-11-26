import { InMemoryReportDocument } from '../services-in-memory/in-memory-report-document.ts';
import { faker } from '@faker-js/faker';
import {
  ReportSnapshot,
  type ReportSnapshotProps,
} from '../../src/domain/sequencing/application/models/report-snapshot.ts';
import type { UniqueEntityID } from '../../src/core/entities/unique-entity-id.ts';

export function makeReport(
  overrides: Partial<ReportSnapshotProps> = {},
  id?: UniqueEntityID,
) {
  return ReportSnapshot.create(
    {
      content: new InMemoryReportDocument({ nome: faker.lorem.words(2) }),
      version: 1,
      ...overrides,
    },
    id,
  );
}
