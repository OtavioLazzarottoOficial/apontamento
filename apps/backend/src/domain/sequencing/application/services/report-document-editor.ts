import { Injectable } from '@nestjs/common';
import type { Either } from '../../../../core/either.ts';
import type { ReportValue } from '../../enterprise/report.ts';
import type { ProductionOrderLine } from '../../enterprise/value-objects/production-order-line.ts';
import type { InvalidLineValuesError } from '../../enterprise/errors/invalid-line-values-error.ts';
import type { LineNotFoundError } from '../usecases/errors/line-not-found-error.ts';

export interface ReportLineChanges {
  index: number;
  requiredQuantity: number;
  completedQuantity: number;
  unitTimeSeconds: number;
  setupTimeSeconds: number;
  dimensions?: string;
  pendingQuantity?: number;
  previousActivity?: number;
  piecesPerCycle?: number;
}

@Injectable()
export abstract class ReportDocumentEditor {
  abstract updateText(
    content: Record<string, ReportValue>,
    page: number,
    index: number,
    text: string,
  ): Either<LineNotFoundError, { content: Record<string, ReportValue> }>;
  abstract updateCompletion(
    content: Record<string, ReportValue>,
    index: number,
    completed: boolean,
  ): Either<LineNotFoundError, { content: Record<string, ReportValue> }>;
  abstract updateLine(
    content: Record<string, ReportValue>,
    changes: ReportLineChanges,
    calculation: ProductionOrderLine,
  ): Either<
    InvalidLineValuesError | LineNotFoundError,
    { content: Record<string, ReportValue> }
  >;
}
