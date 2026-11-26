import { Injectable } from '@nestjs/common';
import { right, type Either } from '../../../../core/either.ts';
import {
  ReportsRepository,
  type ReportSummary,
} from '../repositories/reports-repository.ts';

@Injectable()
export class ListReportsUseCase {
  constructor(private readonly reports: ReportsRepository) {}

  async execute(): Promise<Either<null, { reports: ReportSummary[] }>> {
    return right({ reports: await this.reports.list() });
  }
}
