import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { Report, type ReportValue } from '../../enterprise/report.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';

interface Request {
  id: string;
  expectedVersion: number;
  content: { [key: string]: ReportValue };
}

type Response = Either<
  ReportNotFoundError | VersionConflictError,
  { report: Report }
>;

@Injectable()
export class UpdateReportUseCase {
  constructor(private readonly reports: ReportsRepository) {}

  async execute(request: Request): Promise<Response> {
    const atual = await this.reports.findById(request.id);

    if (!atual) {
      return left(new ReportNotFoundError());
    }

    if (atual.version !== request.expectedVersion) {
      return left(new VersionConflictError());
    }

    const relatorio = Report.create(
      { content: request.content, version: atual.version + 1 },
      atual.id,
    );
    const atualizado = await this.reports.updateIfVersionMatches(
      relatorio,
      request.expectedVersion,
    );

    if (!atualizado) {
      return left(new VersionConflictError());
    }

    return right({ report: relatorio });
  }
}
