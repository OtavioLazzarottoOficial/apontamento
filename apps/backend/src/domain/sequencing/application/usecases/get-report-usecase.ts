import { Injectable } from '@nestjs/common';
import { left, right, type Either } from '../../../../core/either.ts';
import type { ReportSnapshot } from '../models/report-snapshot.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';
import { ReportNotFoundError } from './errors/report-not-found-error.ts';

@Injectable()
export class GetReportUseCase {
  constructor(private readonly reports: ReportsRepository) {}

  async execute(
    id: string,
  ): Promise<Either<ReportNotFoundError, { report: ReportSnapshot }>> {
    const report = await this.reports.findById(id);
    if (!report) {
      return left(new ReportNotFoundError());
    }
    return right({ report });
  }
}
