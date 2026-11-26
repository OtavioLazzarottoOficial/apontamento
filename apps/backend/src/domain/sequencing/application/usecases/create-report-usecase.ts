import { Injectable } from '@nestjs/common';
import { right, type Either } from '../../../../core/either.ts';
import { ReportSnapshot } from '../models/report-snapshot.ts';
import type { ReportDocument } from '../models/report-document.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';

interface Request {
  content: ReportDocument;
}

@Injectable()
export class CreateReportUseCase {
  constructor(private readonly reports: ReportsRepository) {}

  async execute(
    request: Request,
  ): Promise<Either<null, { report: ReportSnapshot }>> {
    const report = ReportSnapshot.create({
      content: request.content,
      version: 1,
    });
    await this.reports.create(report);
    return right({ report });
  }
}
