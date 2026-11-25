import { Injectable } from '@nestjs/common';
import { right, type Either } from '../../../../core/either.ts';
import { Report, type ReportValue } from '../../enterprise/report.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';

interface Request {
  content: { [key: string]: ReportValue };
}

@Injectable()
export class CreateReportUseCase {
  constructor(private readonly reports: ReportsRepository) {}

  async execute(request: Request): Promise<Either<null, { report: Report }>> {
    const relatorio = Report.create({
      content: request.content,
      version: 1,
    });
    await this.reports.create(relatorio);
    return right({ report: relatorio });
  }
}
