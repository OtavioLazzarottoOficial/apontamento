import { Injectable } from '@nestjs/common';
import { left, type Either } from '../../../../core/either.ts';
import type { Report } from '../../enterprise/report.ts';
import { ReportDocumentEditor } from '../services/report-document-editor.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';
import { UpdateReportUseCase } from './update-report-usecase.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';
import { LineNotFoundError } from './errors/line-not-found-error.ts';

@Injectable()
export class UpdateReportTextUseCase {
  constructor(
    private readonly reports: ReportsRepository,
    private readonly update: UpdateReportUseCase,
    private readonly editor: ReportDocumentEditor,
  ) {}

  async execute(request: {
    id: string;
    versaoEsperada: number;
    pagina: number;
    indice: number;
    texto: string;
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
    const result = this.editor.updateText(
      atual.content,
      request.pagina,
      request.indice,
      request.texto,
    );
    if (result.isLeft()) return left(result.value);
    return this.update.execute({
      id: request.id,
      expectedVersion: request.versaoEsperada,
      content: result.value.content,
    });
  }
}
