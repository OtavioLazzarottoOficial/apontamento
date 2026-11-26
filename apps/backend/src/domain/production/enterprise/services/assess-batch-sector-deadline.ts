import { left, right, type Either } from '../../../../core/either.ts';
import {
  assessSectorDeadline,
  type InvalidSectorDeadlineDateError,
  type SectorDeadlineAssessment,
  type SectorOperation,
} from './assess-sector-deadline.ts';

export interface SectorDeadlineRecord {
  batch: string;
  sector: string;
  deadline: string;
}

export type MatchedSectorDeadlineAssessment =
  | { status: 'ambiguous-deadline' }
  | (SectorDeadlineAssessment & { deadline: string | null });

/** Identificadores de lote e setor devem ser previamente identificados; não interpreta planilhas. */
export function assessBatchSectorDeadline(input: {
  batch: string;
  sector: string;
  deadlines: readonly SectorDeadlineRecord[];
  operations: readonly SectorOperation[];
  operationsComplete: boolean;
}): Either<InvalidSectorDeadlineDateError, MatchedSectorDeadlineAssessment> {
  const matches = input.deadlines.filter(
    (deadline) =>
      deadline.batch === input.batch && deadline.sector === input.sector,
  );
  if (matches.length > 1) {
    return right({ status: 'ambiguous-deadline' });
  }
  const deadline = matches[0]?.deadline ?? null;
  const assessment = assessSectorDeadline({
    deadline,
    operations: input.operations,
    operationsComplete: input.operationsComplete,
  });
  if (assessment.isLeft()) {
    return left(assessment.value);
  }
  return right({ ...assessment.value, deadline });
}
