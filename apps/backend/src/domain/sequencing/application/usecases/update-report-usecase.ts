import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { ReportSnapshot } from '../models/report-snapshot.ts';
import type { ReportDocument } from '../models/report-document.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';

interface Request {
  id: string;
  expectedVersion: number;
  content: ReportDocument;
}

type Response = Either<
  ReportNotFoundError | VersionConflictError,
  { report: ReportSnapshot }
>;

@Injectable()
export class UpdateReportUseCase {
  constructor(private readonly reports: ReportsRepository) {}

  async execute(request: Request): Promise<Response> {
    const current = await this.reports.findById(request.id);

    if (!current) {
      return left(new ReportNotFoundError());
    }

    if (current.version !== request.expectedVersion) {
      return left(new VersionConflictError());
    }

    const report = ReportSnapshot.create(
      { content: request.content, version: current.version + 1 },
      current.id,
    );
    const saved = await this.reports.updateIfVersionMatches(
      report,
      request.expectedVersion,
    );

    if (!saved) {
      return left(new VersionConflictError());
    }

    return right({ report });
  }
}
