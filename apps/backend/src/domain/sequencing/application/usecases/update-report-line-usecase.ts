import { Injectable } from '@nestjs/common';
import { left, type Either } from '../../../../core/either.ts';
import type { ReportSnapshot } from '../models/report-snapshot.ts';
import { ProductionOrderLineObjectValue } from '../../enterprise/value-objects/production-order-line-object-value.ts';
import { InvalidLineValuesError } from '../../enterprise/errors/invalid-line-values-error.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';
import { ReportDocumentEditor } from '../services/report-document-editor.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';
import { LineNotFoundError } from './errors/line-not-found-error.ts';

interface Request {
  id: string;
  index: number;
  expectedVersion: number;
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
export class UpdateReportLineUseCase {
  constructor(
    private readonly reports: ReportsRepository,
    private readonly update: UpdateReportUseCase,
    private readonly editor: ReportDocumentEditor,
  ) {}

  async execute(
    request: Request,
  ): Promise<
    Either<
      | ReportNotFoundError
      | VersionConflictError
      | InvalidLineValuesError
      | LineNotFoundError,
      { report: ReportSnapshot }
    >
  > {
    const calculation = ProductionOrderLineObjectValue.create({
      requiredQuantity: request.requiredQuantity,
      completedQuantity: request.completedQuantity,
      unitTimeSeconds: request.unitTimeSeconds,
      setupTimeSeconds: request.setupTimeSeconds,
    });
    if (calculation.isLeft()) {
      return left(calculation.value);
    }

    if (
      [
        request.pendingQuantity,
        request.previousActivity,
        request.piecesPerCycle,
      ].some(
        (value) =>
          value !== undefined && (!Number.isSafeInteger(value) || value < 0),
      )
    ) {
      return left(new InvalidLineValuesError());
    }

    const report = await this.reports.findById(request.id);
    if (!report) {
      return left(new ReportNotFoundError());
    }
    if (report.version !== request.expectedVersion) {
      return left(new VersionConflictError());
    }

    const updated = this.editor.updateLine(
      report.content,
      {
        index: request.index,
        requiredQuantity: request.requiredQuantity,
        completedQuantity: request.completedQuantity,
        unitTimeSeconds: request.unitTimeSeconds,
        setupTimeSeconds: request.setupTimeSeconds,
        dimensions: request.dimensions,
        pendingQuantity: request.pendingQuantity,
        previousActivity: request.previousActivity,
        piecesPerCycle: request.piecesPerCycle,
      },
      calculation.value,
      report.id.toString(),
    );
    if (updated.isLeft()) {
      return left(updated.value);
    }

    return this.update.execute({
      id: request.id,
      expectedVersion: request.expectedVersion,
      content: updated.value.content,
    });
  }
}
