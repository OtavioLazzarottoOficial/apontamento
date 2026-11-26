import { Injectable } from '@nestjs/common';
import type { Either } from '../../../../core/either.ts';
import type { ReportDocument } from '../models/report-document.ts';
import type { ProductionOrderLineObjectValue } from '../../enterprise/value-objects/production-order-line-object-value.ts';
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
  abstract updateMachine(
    content: ReportDocument,
    machineId: string | null,
  ): ReportDocument;

  abstract updateText(
    content: ReportDocument,
    page: number,
    index: number,
    text: string,
  ): Either<LineNotFoundError, { content: ReportDocument }>;
  abstract updateCompletion(
    content: ReportDocument,
    index: number,
    completed: boolean,
  ): Either<LineNotFoundError, { content: ReportDocument }>;
  abstract updateLine(
    content: ReportDocument,
    changes: ReportLineChanges,
    calculation: ProductionOrderLineObjectValue,
    reportId: string,
  ): Either<
    InvalidLineValuesError | LineNotFoundError,
    { content: ReportDocument }
  >;
}
