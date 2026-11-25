import { Injectable } from '@nestjs/common';
import { left, type Either } from '../../../../core/either.ts';
import type { Report } from '../../enterprise/report.ts';
import { ReportDocumentEditor } from '../services/report-document-editor.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { LineNotFoundError } from './errors/line-not-found-error.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';

@Injectable()
export class UpdateLineCompletionUseCase {
  constructor(
    private readonly reports: ReportsRepository,
    private readonly update: UpdateReportUseCase,
    private readonly editor: ReportDocumentEditor,
  ) {}

  async execute(request: {
    id: string;
    indice: number;
    versaoEsperada: number;
    concluida: boolean;
  }): Promise<
    Either<
      ReportNotFoundError | VersionConflictError | LineNotFoundError,
      { report: Report }
    >
  > {
    const atual = await this.reports.findById(request.id);
    if (!atual) return left(new ReportNotFoundError());
    if (atual.version !== request.versaoEsperada)
      return left(new VersionConflictError());
    const result = this.editor.updateCompletion(
      atual.content,
      request.indice,
      request.concluida,
    );
    if (result.isLeft()) return left(result.value);
    return this.update.execute({
      id: request.id,
      expectedVersion: request.versaoEsperada,
      content: result.value.content,
    });
  }
}
