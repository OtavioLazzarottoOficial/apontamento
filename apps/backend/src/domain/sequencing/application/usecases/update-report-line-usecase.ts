import { Injectable } from '@nestjs/common';
import { left, type Either } from '../../../../core/either.ts';
import type { Report } from '../../enterprise/report.ts';
import { ProductionOrderLine } from '../../enterprise/value-objects/production-order-line.ts';
import { InvalidLineValuesError } from '../../enterprise/errors/invalid-line-values-error.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';
import { ReportDocumentEditor } from '../services/report-document-editor.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';
import { LineNotFoundError } from './errors/line-not-found-error.ts';

interface Request {
  id: string;
  indice: number;
  versaoEsperada: number;
  necessaria: number;
  realizada: number;
  tempoUnitarioSegundos: number;
  tempoSetupSegundos: number;
  dimensoes?: string;
  pendente?: number;
  anterior?: number;
  pecasPorCiclo?: number;
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
      { report: Report }
    >
  > {
    const calculation = ProductionOrderLine.create({
      requiredQuantity: request.necessaria,
      completedQuantity: request.realizada,
      unitTimeSeconds: request.tempoUnitarioSegundos,
      setupTimeSeconds: request.tempoSetupSegundos,
    });
    if (calculation.isLeft()) {
      return left(calculation.value);
    }

    if (
      [request.pendente, request.anterior, request.pecasPorCiclo].some(
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
    if (report.version !== request.versaoEsperada) {
      return left(new VersionConflictError());
    }

    const updated = this.editor.updateLine(
      report.content,
      {
        index: request.indice,
        requiredQuantity: request.necessaria,
        completedQuantity: request.realizada,
        unitTimeSeconds: request.tempoUnitarioSegundos,
        setupTimeSeconds: request.tempoSetupSegundos,
        dimensions: request.dimensoes,
        pendingQuantity: request.pendente,
        previousActivity: request.anterior,
        piecesPerCycle: request.pecasPorCiclo,
      },
      calculation.value,
    );
    if (updated.isLeft()) {
      return left(updated.value);
    }

    return this.update.execute({
      id: request.id,
      expectedVersion: request.versaoEsperada,
      content: updated.value.content,
    });
  }
}
