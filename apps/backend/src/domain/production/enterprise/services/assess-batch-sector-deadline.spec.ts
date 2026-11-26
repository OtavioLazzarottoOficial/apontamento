import { describe, expect, it } from 'vitest';
import { assessBatchSectorDeadline } from './assess-batch-sector-deadline.ts';

describe('matching deadlines by batch and sector', () => {
  const input = {
    batch: '1110',
    sector: 'Usinagem',
    operationsComplete: true,
    operations: [{ id: 'op-1', completionDate: '2026-11-27' }],
    deadlines: [
      { batch: '1110', sector: 'Usinagem', deadline: '2026-11-26' },
      { batch: '1110', sector: 'Montagem', deadline: '2026-11-30' },
      { batch: '1010', sector: 'Usinagem', deadline: '2026-11-30' },
    ],
  };

  it('compares with the matching batch and sector', () => {
    expect(assessBatchSectorDeadline(input).value).toMatchObject({
      status: 'late',
      deadline: '2026-11-26',
      lateOperationIds: ['op-1'],
    });
  });

  it('does not infer a deadline when there is no matching sector', () => {
    expect(
      assessBatchSectorDeadline({ ...input, sector: 'Pintura' }).value,
    ).toMatchObject({ status: 'deadline-unknown', deadline: null });
  });

  it('treats multiple matches as ambiguous, even when their dates match', () => {
    expect(
      assessBatchSectorDeadline({
        ...input,
        deadlines: [...input.deadlines, input.deadlines[0]],
      }).value,
    ).toEqual({ status: 'ambiguous-deadline' });
  });
});
