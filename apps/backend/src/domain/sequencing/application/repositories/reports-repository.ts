import { Injectable } from '@nestjs/common';
import type { ReportSnapshot } from '../models/report-snapshot.ts';

export interface ReportSummary {
  id: string;
  version: number;
  name: string;
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
  abstract create(report: ReportSnapshot): Promise<void>;
  abstract findById(id: string): Promise<ReportSnapshot | null>;
  abstract updateIfVersionMatches(
    report: ReportSnapshot,
    expectedVersion: number,
  ): Promise<boolean>;
}
