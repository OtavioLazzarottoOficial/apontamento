import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';
import { VersionConflictError } from './errors/version-conflict-error.ts';
@Injectable()
export class DeleteReportUseCase {
  constructor(private readonly reports: ReportsRepository) {}
  async execute(
    id: string,
    expectedVersion: number,
  ): Promise<Either<ReportNotFoundError | VersionConflictError, null>> {
    if (await this.reports.deleteIfVersionMatches(id, expectedVersion))
      return right(null);
    if (!(await this.reports.findById(id)))
      return left(new ReportNotFoundError());
    return left(new VersionConflictError());
  }
}
