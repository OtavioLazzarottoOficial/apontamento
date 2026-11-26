import { describe, expect, it } from 'vitest';
import { PrismaReportSummaryMapper } from './prisma-report-summary-mapper.ts';

describe('PrismaReportSummaryMapper', () => {
  it('includes areas from all dates and retains areas without a date', () => {
    const summary = PrismaReportSummaryMapper.toDomain({
      id: 'report',
      versao: 1,
      nome: 'Report',
      machine_id: 'machine',
      linhas: [
        { dataEntrega: '24/11/2026', area: 6.32 },
        { dataEntrega: '25/11/2026', area: 12 },
        { dataEntrega: '', area: 2 },
        { area: 3 },
      ],
    });
    expect(summary.dailyAreas).toEqual([
      { date: '24/11/2026', area: 6.32 },
      { date: '25/11/2026', area: 12 },
      { date: '', area: 5 },
    ]);
  });
});
