import { faker } from '@faker-js/faker';
import type { UniqueEntityID } from '../../src/core/entities/unique-entity-id.ts';
import {
  Sequencing,
  type SequencingProps,
} from '../../src/domain/sequencing/enterprise/sequencing.ts';
import {
  SequencingLineObjectValue,
  type SequencingLineProps,
} from '../../src/domain/sequencing/enterprise/value-objects/sequencing-line-object-value.ts';

export function makeSequencingLine(
  overrides: Partial<SequencingLineProps> = {},
) {
  const result = SequencingLineObjectValue.create({
    deliveryDate: '25/11/2026',
    schedule: '01/11/2026',
    batch: faker.number.int({ min: 100, max: 9999 }).toString(),
    lengthMm: faker.number.int({ min: 100, max: 2000 }).toString(),
    widthMm: faker.number.int({ min: 100, max: 2000 }).toString(),
    requiredQuantity: faker.number.int({ min: 1, max: 100 }),
    completedQuantity: 0,
    unitTimeSeconds: faker.number.int({ min: 1, max: 120 }),
    setupTimeSeconds: 0,
    ...overrides,
  });
  if (result.isLeft()) throw result.value;
  return result.value;
}

export function makeSequencing(
  overrides: Partial<SequencingProps> = {},
  id?: UniqueEntityID,
) {
  return Sequencing.create({ lines: [makeSequencingLine()], ...overrides }, id);
}
