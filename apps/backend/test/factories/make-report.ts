import { faker } from '@faker-js/faker';
import {
  Report,
  type ReportProps,
} from '../../src/domain/sequencing/enterprise/report.ts';
import type { UniqueEntityID } from '../../src/core/entities/unique-entity-id.ts';

export function makeReport(
  overrides: Partial<ReportProps> = {},
  id?: UniqueEntityID,
) {
  return Report.create(
    { content: { nome: faker.lorem.words(2) }, version: 1, ...overrides },
    id,
  );
}
