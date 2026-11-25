import { Injectable } from '@nestjs/common';
import type { Report } from '../../enterprise/report.ts';

export interface ReportSummary {
  id: string;
  versao: number;
  nome: string;
  machineId: string | null;
  dailyAreas: { date: string; area: number }[];
}

@Injectable()
export abstract class ReportsRepository {
  abstract list(): Promise<ReportSummary[]>;
  abstract deleteIfVersionMatches(
    id: string,
    expectedVersion: number,
  ): Promise<boolean>;
  abstract create(relatorio: Report): Promise<void>;
  abstract findById(id: string): Promise<Report | null>;
  abstract updateIfVersionMatches(
    relatorio: Report,
    versaoEsperada: number,
  ): Promise<boolean>;
}
