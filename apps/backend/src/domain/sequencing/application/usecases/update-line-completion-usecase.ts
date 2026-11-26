import { Injectable } from '@nestjs/common';
import { left, type Either } from '../../../../core/either.ts';
import type { ReportSnapshot } from '../models/report-snapshot.ts';
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
    index: number;
    expectedVersion: number;
    completed: boolean;
  }): Promise<
    Either<
      ReportNotFoundError | VersionConflictError | LineNotFoundError,
      { report: ReportSnapshot }
    >
  > {
    const current = await this.reports.findById(request.id);
    if (!current) return left(new ReportNotFoundError());
    if (current.version !== request.expectedVersion)
      return left(new VersionConflictError());
    const result = this.editor.updateCompletion(
      current.content,
      request.index,
      request.completed,
    );
    if (result.isLeft()) return left(result.value);
    return this.update.execute({
      id: request.id,
      expectedVersion: request.expectedVersion,
      content: result.value.content,
    });
  }
}
