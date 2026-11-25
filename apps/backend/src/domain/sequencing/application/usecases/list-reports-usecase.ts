import { Injectable } from '@nestjs/common';
import { right } from '../../../../core/either.ts';
import { ReportsRepository } from '../repositories/reports-repository.ts';

@Injectable()
export class ListReportsUseCase {
  constructor(private readonly reports: ReportsRepository) {}

  async execute() {
    return right({ relatorios: await this.reports.list() });
  }
}
