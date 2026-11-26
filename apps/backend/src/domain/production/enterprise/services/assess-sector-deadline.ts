import { left, right, type Either } from '../../../../core/either.ts';

export interface SectorOperation {
  id: string;
  completionDate: string | null;
}

export interface SectorDeadlineAssessment {
  status: 'deadline-unknown' | 'incomplete' | 'late' | 'on-time';
  latestCompletionDate: string | null;
  lateOperationIds: string[];
}

export class InvalidSectorDeadlineDateError extends Error {
  constructor() {
    super('Informe datas válidas no formato AAAA-MM-DD.');
  }
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonth[month - 1];
}

/** Avalia somente operações previamente identificadas para o mesmo lote e setor. */
export function assessSectorDeadline(input: {
  deadline: string | null;
  operations: readonly SectorOperation[];
  operationsComplete: boolean;
}): Either<InvalidSectorDeadlineDateError, SectorDeadlineAssessment> {
  if (
    (input.deadline !== null && !isValidDate(input.deadline)) ||
    input.operations.some(
      (operation) =>
        operation.completionDate !== null &&
        !isValidDate(operation.completionDate),
    )
  ) {
    return left(new InvalidSectorDeadlineDateError());
  }

  const dates = input.operations.flatMap((operation) =>
    operation.completionDate === null ? [] : [operation.completionDate],
  );
  const latestCompletionDate = dates.reduce<string | null>(
    (latest, date) => (latest === null || date > latest ? date : latest),
    null,
  );

  if (input.deadline === null) {
    return right({
      status: 'deadline-unknown',
      latestCompletionDate,
      lateOperationIds: [],
    });
  }

  const deadline = input.deadline;
  const lateOperationIds = input.operations
    .filter(
      (operation) =>
        operation.completionDate !== null &&
        operation.completionDate > deadline,
    )
    .map((operation) => operation.id);
  if (lateOperationIds.length > 0) {
    return right({ status: 'late', latestCompletionDate, lateOperationIds });
  }

  if (
    !input.operationsComplete ||
    input.operations.length === 0 ||
    dates.length !== input.operations.length
  ) {
    return right({
      status: 'incomplete',
      latestCompletionDate,
      lateOperationIds: [],
    });
  }

  return right({
    status: 'on-time',
    latestCompletionDate,
    lateOperationIds: [],
  });
}
