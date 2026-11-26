import { describe, expect, it } from 'vitest';
import {
  assessSectorDeadline,
  InvalidSectorDeadlineDateError,
} from './assess-sector-deadline.ts';

describe('sector deadline assessment', () => {
  const operations = [
    { id: 'machine-1', completionDate: '2026-11-15' },
    { id: 'machine-2', completionDate: '2026-11-16' },
    { id: 'machine-3', completionDate: '2026-11-17' },
  ];

  it('accepts different days up to and including the deadline when the set is complete', () => {
    const result = assessSectorDeadline({
      deadline: '2026-11-17',
      operations,
      operationsComplete: true,
    });
    expect(result.value).toMatchObject({
      status: 'on-time',
      latestCompletionDate: '2026-11-17',
      lateOperationIds: [],
    });
  });

  it('reports an identified late operation even if other operations are missing', () => {
    const result = assessSectorDeadline({
      deadline: '2026-11-17',
      operations: [
        ...operations,
        { id: 'machine-4', completionDate: '2026-11-18' },
      ],
      operationsComplete: false,
    });
    expect(result.value).toMatchObject({
      status: 'late',
      latestCompletionDate: '2026-11-18',
      lateOperationIds: ['machine-4'],
    });
  });

  it('does not claim a deadline was met for missing operations or dates', () => {
    expect(
      assessSectorDeadline({
        deadline: '2026-11-17',
        operations,
        operationsComplete: false,
      }).value,
    ).toMatchObject({ status: 'incomplete' });
    expect(
      assessSectorDeadline({
        deadline: '2026-11-17',
        operations: [],
        operationsComplete: true,
      }).value,
    ).toMatchObject({ status: 'incomplete' });
    expect(
      assessSectorDeadline({
        deadline: '2026-11-17',
        operations: [{ id: 'a', completionDate: null }],
        operationsComplete: true,
      }).value,
    ).toMatchObject({ status: 'incomplete' });
  });

  it('reports an unknown deadline and rejects invalid dates', () => {
    expect(
      assessSectorDeadline({
        deadline: null,
        operations,
        operationsComplete: true,
      }).value,
    ).toMatchObject({ status: 'deadline-unknown' });
    expect(
      assessSectorDeadline({
        deadline: '2026-02-29',
        operations,
        operationsComplete: true,
      }).value,
    ).toBeInstanceOf(InvalidSectorDeadlineDateError);
    expect(
      assessSectorDeadline({
        deadline: '2024-02-29',
        operations: [],
        operationsComplete: false,
      }).isRight(),
    ).toBe(true);
  });
});
